import type { Profile, TeamLens, TeamAssessment, TeamId, ScoreResult, TeamScore, RiskLevel, ApprovalStatus } from '../types';
import { makeEmptyAssessment } from '../types';
import { isRequired, escalatedLensIds } from './reviewIntensity';
import { computeRecommendation } from './recommendation';
import { isCurrentAssessment, isEvidenceComplete } from './evidence';

export const METHODOLOGY_VERSION = 'aegis-readiness-2.0';
export const METHODOLOGY_NOTE = 'Internal readiness rubric, not an industry percentile or certification. Controls and decisions are self-reported. Evidence links are references, not independent verification. Formal approval remains external.';

export interface EngineInput {
  profile: Profile;
  lenses: TeamLens[];
  getAssessment: (teamId: TeamId) => TeamAssessment;
  asOf?: string;
}

function scoreTeam(lens: TeamLens, a: TeamAssessment, profile: Profile, asOf: string): TeamScore {
  const scopeCurrent = isCurrentAssessment(a, profile);
  const controlsTotal = lens.requiredControls.length;
  const controlsComplete = scopeCurrent ? lens.requiredControls.filter((c) => a.checkedControls[c.id] === true).length : 0;
  const evidenceTotal = lens.evidenceRequired.length;
  const missingEvidenceIds = lens.evidenceRequired.filter((e) => !isEvidenceComplete(a, e.id, profile, asOf)).map((e) => e.id);
  const evidenceComplete = evidenceTotal - missingEvidenceIds.length;
  // Only catalogue blockers count. Previous blockers remain open until cleared.
  const active = lens.blockers.filter((b) => a.activeBlockers[b.id] === true);
  const hasCriticalBlocker = active.some((b) => b.critical) || a.decision === 'Blocked';
  const denom = controlsTotal + evidenceTotal;
  const completeness = denom === 0 ? 1 : (controlsComplete + evidenceComplete) / denom;
  const raw = scopeCurrent && Number.isInteger(a.score) && a.score >= 0 && a.score <= 5 ? a.score : 0;
  const normalized = Math.round((raw / 5) * 100 * (0.5 + 0.5 * completeness));
  const gateReasons: string[] = [];
  if (!scopeCurrent) gateReasons.push('Review this assessment against the current scope.');
  if (hasCriticalBlocker || active.length) gateReasons.push('Resolve open blockers.');
  if (controlsComplete < controlsTotal) gateReasons.push('Complete the required controls.');
  if (missingEvidenceIds.length) gateReasons.push('Attach current evidence to each required item and mark it complete.');
  if (a.needsRemediation || a.decision === 'Needs Remediation') gateReasons.push('Resolve the recorded remediation requirement.');
  if (normalized < 80) gateReasons.push('Raise assessed readiness to at least 80%.');
  return {
    teamId: lens.id, required: isRequired(lens, profile), escalated: escalatedLensIds(profile).has(lens.id),
    score: raw, normalized, controlsTotal, controlsComplete, evidenceTotal, evidenceComplete,
    activeBlockers: active.length, hasCriticalBlocker, completeness, scopeCurrent,
    readyForReview: gateReasons.length === 0, missingEvidenceIds, gateReasons,
  };
}

export function computeRisk(profile: Profile, hasCriticalBlocker: boolean): RiskLevel {
  if (hasCriticalBlocker) return 'Critical';
  const sensitive = profile.pii || profile.clientData || ['Confidential', 'Restricted'].includes(profile.dataClassification);
  if (profile.autonomousActions && sensitive) return 'Critical';
  let score = { Public: 0, Internal: 1, Confidential: 2, Restricted: 3 }[profile.dataClassification] ?? 3;
  if (profile.pii) score += 1;
  if (profile.clientData) score += 2;
  if (profile.agentEnabled) score += 1;
  if (profile.connectorEnabled) score += 1;
  if (profile.autonomousActions) score += 2;
  if (profile.externalVendor) score += 1;
  if (profile.environment === 'Production') score += 1;
  if (score >= 7) return 'Critical';
  if (score >= 5 || profile.autonomousActions) return 'High';
  if (score >= 3) return 'Medium';
  return 'Low';
}

export function computeScore({ profile, lenses, getAssessment, asOf = new Date().toISOString() }: EngineInput): ScoreResult {
  const perTeam: Record<string, TeamScore> = {};
  const assessments: Record<string, TeamAssessment> = {};
  for (const lens of lenses) {
    assessments[lens.id] = getAssessment(lens.id);
    perTeam[lens.id] = scoreTeam(lens, assessments[lens.id], profile, asOf);
  }
  const required = Object.values(perTeam).filter((t) => t.required);
  const sum = (field: 'controlsComplete' | 'controlsTotal' | 'evidenceComplete' | 'evidenceTotal' | 'activeBlockers') => required.reduce((s, t) => s + t[field], 0);
  let weighted = 0, weights = 0;
  for (const lens of lenses) {
    if (!perTeam[lens.id].required || !Number.isFinite(lens.weight) || lens.weight <= 0) continue;
    weighted += perTeam[lens.id].normalized * lens.weight;
    weights += lens.weight;
  }
  const readiness = weights ? Math.round(weighted / weights) : 0;
  const hasCriticalBlocker = required.some((t) => t.hasCriticalBlocker);
  const risk = computeRisk(profile, hasCriticalBlocker);
  const teamsReady = required.filter((t) => t.readyForReview).length;
  const gateReasons = required.flatMap((t) => t.gateReasons.map((reason) => `${lenses.find((l) => l.id === t.teamId)!.title}: ${reason}`));
  if (!required.length) gateReasons.push('No required reviews are configured.');
  let recommendation = computeRecommendation(readiness, risk, hasCriticalBlocker);
  if (!hasCriticalBlocker && gateReasons.length && (recommendation === 'Proceed' || recommendation === 'Proceed with Conditions')) recommendation = 'Needs Remediation';
  // Explicit self-reported decisions, independent of the numeric recommendation.
  let approvalStatus: ApprovalStatus = 'Not Started';
  if (hasCriticalBlocker) approvalStatus = 'Blocked';
  else if (required.length && teamsReady === required.length && required.every((t) => ['Approved', 'Approved with Conditions'].includes(assessments[t.teamId].decision))) {
    approvalStatus = required.some((t) => assessments[t.teamId].decision === 'Approved with Conditions') ? 'Approved with Conditions' : 'Approved';
  } else if (required.some((t) => assessments[t.teamId].score >= 0 || assessments[t.teamId].decision !== 'Not Reviewed' || t.controlsComplete > 0 || t.evidenceComplete > 0)) approvalStatus = 'In Progress';
  return {
    methodologyVersion: METHODOLOGY_VERSION, evaluatedAt: asOf, gateReasons,
    readiness, risk, recommendation, approvalStatus,
    evidenceCompleteness: sum('evidenceTotal') ? Math.round(sum('evidenceComplete') / sum('evidenceTotal') * 100) : 0,
    controlsComplete: sum('controlsComplete'), controlsRemaining: sum('controlsTotal') - sum('controlsComplete'),
    blockersCount: sum('activeBlockers'), hasCriticalBlocker, teamsReady,
    teamsBlocked: required.filter((t) => t.hasCriticalBlocker || t.activeBlockers > 0).length,
    requiredTeams: required.length, perTeam,
  };
}

export function computeScoreFromMap(profile: Profile, lenses: TeamLens[], assessments: Record<string, TeamAssessment | undefined>, asOf?: string): ScoreResult {
  return computeScore({ profile, lenses, getAssessment: (id) => assessments[id] ?? makeEmptyAssessment(id), asOf });
}

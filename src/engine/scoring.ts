import type {
  Profile,
  TeamLens,
  TeamAssessment,
  TeamId,
  ScoreResult,
  TeamScore,
  RiskLevel,
} from '../types';
import { makeEmptyAssessment } from '../types';
import { isRequired, escalatedLensIds } from './reviewIntensity';
import { computeRecommendation, recommendationToApproval } from './recommendation';

export interface EngineInput {
  profile: Profile;
  lenses: TeamLens[];
  getAssessment: (teamId: TeamId) => TeamAssessment;
}

/** Count how many of a lens's critical blockers are flagged active. */
function criticalBlockersActive(lens: TeamLens, a: TeamAssessment): number {
  return lens.blockers.filter((b) => b.critical && a.activeBlockers[b.id]).length;
}

function scoreTeam(lens: TeamLens, a: TeamAssessment, profile: Profile): TeamScore {
  const required = isRequired(lens, profile);
  const escalated = escalatedLensIds(profile).has(lens.id);

  const controlsTotal = lens.requiredControls.length;
  const controlsComplete = lens.requiredControls.filter((c) => a.checkedControls[c.id]).length;
  const evidenceTotal = lens.evidenceRequired.length;
  const evidenceComplete = lens.evidenceRequired.filter((e) => a.checkedEvidence[e.id]).length;

  const activeBlockers = Object.values(a.activeBlockers).filter(Boolean).length;
  const hasCriticalBlocker =
    criticalBlockersActive(lens, a) > 0 || a.decision === 'Blocked';

  const denom = controlsTotal + evidenceTotal;
  const completeness = denom === 0 ? 1 : (controlsComplete + evidenceComplete) / denom;

  // score 0..5 -> 0..100, unset (-1) treated as 0
  const raw = a.score < 0 ? 0 : a.score;
  let normalized = (raw / 5) * 100;
  // Missing evidence / controls drag the score down (0.5..1.0 factor)
  normalized = normalized * (0.5 + 0.5 * completeness);
  if (hasCriticalBlocker) normalized = 0;

  return {
    teamId: lens.id,
    required,
    escalated,
    score: a.score,
    normalized: Math.round(normalized),
    controlsTotal,
    controlsComplete,
    evidenceTotal,
    evidenceComplete,
    activeBlockers,
    hasCriticalBlocker,
    completeness,
  };
}

export function computeRisk(profile: Profile, hasCriticalBlocker: boolean): RiskLevel {
  if (hasCriticalBlocker) return 'Critical';

  let score = 0;
  // Data sensitivity
  if (profile.dataClassification === 'Restricted') score += 3;
  else if (profile.dataClassification === 'Confidential') score += 2;
  else if (profile.dataClassification === 'Internal') score += 1;
  if (profile.pii) score += 1;
  if (profile.clientData) score += 2;

  // Capability / action sensitivity
  if (profile.agentEnabled) score += 1;
  if (profile.connectorEnabled) score += 1;
  if (profile.autonomousActions) score += 2;
  if (profile.externalVendor) score += 1;
  if (profile.environment === 'Production') score += 1;

  if (score >= 7) return 'Critical';
  if (score >= 5) return 'High';
  if (score >= 3) return 'Medium';
  return 'Low';
}

export function computeScore(input: EngineInput): ScoreResult {
  const { profile, lenses, getAssessment } = input;

  const perTeam: Record<string, TeamScore> = {};
  const requiredTeams: TeamScore[] = [];
  let controlsComplete = 0;
  let controlsTotalReq = 0;
  let evidenceComplete = 0;
  let evidenceTotalReq = 0;
  let blockersCount = 0;
  let hasCriticalBlocker = false;

  for (const lens of lenses) {
    const a = getAssessment(lens.id);
    const ts = scoreTeam(lens, a, profile);
    perTeam[lens.id] = ts;
    blockersCount += ts.activeBlockers;
    if (ts.hasCriticalBlocker) hasCriticalBlocker = true;
    if (ts.required) {
      requiredTeams.push(ts);
      controlsComplete += ts.controlsComplete;
      controlsTotalReq += ts.controlsTotal;
      evidenceComplete += ts.evidenceComplete;
      evidenceTotalReq += ts.evidenceTotal;
    }
  }

  // Weighted average of required team normalized scores.
  let weightedSum = 0;
  let weightTotal = 0;
  for (const ts of requiredTeams) {
    const lens = lenses.find((l) => l.id === ts.teamId)!;
    weightedSum += ts.normalized * lens.weight;
    weightTotal += lens.weight;
  }
  let readiness = weightTotal === 0 ? 0 : Math.round(weightedSum / weightTotal);
  if (hasCriticalBlocker) readiness = 0;

  const evidenceCompleteness =
    evidenceTotalReq === 0 ? 0 : Math.round((evidenceComplete / evidenceTotalReq) * 100);

  const risk = computeRisk(profile, hasCriticalBlocker);
  const recommendation = computeRecommendation(readiness, risk, hasCriticalBlocker);
  const approvalStatus = recommendationToApproval(recommendation);

  const teamsReady = requiredTeams.filter((t) => t.normalized >= 80 && !t.hasCriticalBlocker).length;
  const teamsBlocked = requiredTeams.filter((t) => t.hasCriticalBlocker).length;

  return {
    readiness,
    risk,
    recommendation,
    approvalStatus,
    evidenceCompleteness,
    controlsComplete,
    controlsRemaining: Math.max(0, controlsTotalReq - controlsComplete),
    blockersCount,
    hasCriticalBlocker,
    teamsReady,
    teamsBlocked,
    requiredTeams: requiredTeams.length,
    perTeam,
  };
}

/** Convenience for callers that only have a plain assessment map. */
export function computeScoreFromMap(
  profile: Profile,
  lenses: TeamLens[],
  assessments: Record<string, TeamAssessment | undefined>,
): ScoreResult {
  return computeScore({
    profile,
    lenses,
    getAssessment: (teamId) => assessments[teamId] ?? makeEmptyAssessment(teamId),
  });
}

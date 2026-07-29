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
import {
  isRequired,
  escalatedLensIds,
  reviewDepth,
  controlsAtDepth,
  evidenceAtDepth,
} from './reviewIntensity';
import { computeRecommendation, recommendationToApproval } from './recommendation';
import { certificationStatus, type Certification } from './recertification';

export interface EngineInput {
  profile: Profile;
  lenses: TeamLens[];
  getAssessment: (teamId: TeamId) => TeamAssessment;
  /**
   * When the current clearance expires, and what date to judge that against.
   * Omitted where certification isn't tracked — the public scope preview, the
   * marketing demo — and the result then carries `certification: null`.
   */
  certification?: Certification;
}

/** Count how many of a lens's critical blockers are flagged active. */
function criticalBlockersActive(lens: TeamLens, a: TeamAssessment): number {
  return lens.blockers.filter((b) => b.critical && a.activeBlockers[b.id]).length;
}

/**
 * Has anyone actually worked this review?
 *
 * Without this, an evaluation created five seconds ago reads exactly like one
 * where every team looked hard and found the tool unacceptable: both are zeros.
 * That makes the headline number untrustworthy for the entire middle of a
 * review — the period when someone is most likely to be looking at it.
 */
export function isStarted(a: TeamAssessment): boolean {
  return (
    a.score >= 0 ||
    a.decision !== 'Not Reviewed' ||
    Object.values(a.checkedControls).some(Boolean) ||
    Object.values(a.checkedEvidence).some(Boolean) ||
    Object.values(a.activeBlockers).some(Boolean) ||
    a.notes.trim() !== '' ||
    a.owner.trim() !== ''
  );
}

/**
 * How much of the self-score survives without substantiation.
 *
 * The old model let judgement carry the whole number and used completeness only
 * as a 0.5–1.0 haircut, so a team that skipped every control and rated itself
 * 5/5 scored 50 while a team that completed everything and honestly rated
 * itself 3/5 scored 60. The opinion was worth five times the work. Here the
 * evidence sets the ceiling — no controls, no points — and the reviewer's
 * judgement moves the result within 40–100% of what that evidence supports.
 * The judgement still matters, because a reviewer can see what a checklist
 * cannot; it just can no longer manufacture readiness out of nothing.
 */
const JUDGEMENT_FLOOR = 0.4;

function scoreTeam(lens: TeamLens, a: TeamAssessment, profile: Profile): TeamScore {
  const required = isRequired(lens, profile);
  const escalated = escalatedLensIds(profile).has(lens.id);

  // Only what this depth actually asks for counts toward completeness. Scoring
  // a Screening review against the full control set would leave every low-risk
  // tool permanently stuck below 50%, which is the same failure as demanding
  // the controls in the first place.
  const depth = reviewDepth(lens, profile);
  const controls = controlsAtDepth(lens, depth);
  const evidence = evidenceAtDepth(lens, depth);

  const controlsTotal = controls.length;
  const controlsComplete = controls.filter((c) => a.checkedControls[c.id]).length;
  const evidenceTotal = evidence.length;
  const evidenceComplete = evidence.filter((e) => a.checkedEvidence[e.id]).length;

  const activeBlockers = Object.values(a.activeBlockers).filter(Boolean).length;
  const hasCriticalBlocker =
    criticalBlockersActive(lens, a) > 0 || a.decision === 'Blocked';

  const denom = controlsTotal + evidenceTotal;
  const completeness = denom === 0 ? 1 : (controlsComplete + evidenceComplete) / denom;

  // Evidence sets the ceiling; the 0–5 judgement moves the result within it.
  // An unset score (-1) counts as 0 — an unscored review is an incomplete one.
  const raw = a.score < 0 ? 0 : a.score;
  let normalized = 100 * completeness * (JUDGEMENT_FLOOR + (1 - JUDGEMENT_FLOOR) * (raw / 5));
  if (hasCriticalBlocker) normalized = 0;

  return {
    teamId: lens.id,
    required,
    escalated,
    depth,
    score: a.score,
    started: isStarted(a),
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
    // Only lenses in scope can affect the result. A blocker left flagged on a
    // review that doesn't apply — from a template default, or from an earlier
    // profile before the tool was scoped down — used to zero out readiness and
    // drive risk to Critical, which makes the scoping promise a lie.
    if (ts.required) {
      requiredTeams.push(ts);
      blockersCount += ts.activeBlockers;
      if (ts.hasCriticalBlocker) hasCriticalBlocker = true;
      controlsComplete += ts.controlsComplete;
      controlsTotalReq += ts.controlsTotal;
      evidenceComplete += ts.evidenceComplete;
      evidenceTotalReq += ts.evidenceTotal;
    }
  }

  // Weighted average over *started* required lenses. Averaging in reviews
  // nobody has opened would report "we haven't looked yet" as "this scored
  // zero" — the recommendation, not the average, is what withholds a positive
  // call until coverage is complete.
  const startedTeams = requiredTeams.filter((t) => t.started);
  let weightedSum = 0;
  let weightTotal = 0;
  for (const ts of startedTeams) {
    const lens = lenses.find((l) => l.id === ts.teamId)!;
    weightedSum += ts.normalized * lens.weight;
    weightTotal += lens.weight;
  }
  let readiness = weightTotal === 0 ? 0 : Math.round(weightedSum / weightTotal);
  if (hasCriticalBlocker) readiness = 0;

  // Nothing required means nothing outstanding — the same empty-set convention
  // scoreTeam uses. Reporting 0% when a Screening-depth review asks for no
  // evidence reads as a failure to collect it.
  const evidenceCompleteness =
    evidenceTotalReq === 0 ? 100 : Math.round((evidenceComplete / evidenceTotalReq) * 100);

  const coverage = requiredTeams.length === 0 ? 0 : startedTeams.length / requiredTeams.length;

  const risk = computeRisk(profile, hasCriticalBlocker);
  const cert = input.certification ? certificationStatus(input.certification) : null;

  // An expired clearance is not a current one. Forcing it here rather than at
  // each call site means the document, the dashboard, and the API cannot
  // disagree about whether a tool is still approved — a stale "Proceed" in an
  // evidence pack is exactly the failure this product is sold to prevent.
  let recommendation = computeRecommendation(readiness, risk, hasCriticalBlocker, coverage);
  if (cert?.state === 'expired' && recommendation !== 'Blocked') {
    recommendation = 'Recertification Due';
  }
  const approvalStatus = recommendationToApproval(recommendation);

  // "Signed off" means a reviewer recorded a decision, which is what a reader
  // of the report means by ready. The old measure — normalized >= 80 — let the
  // same document say every team approved and simultaneously that zero were
  // ready, which is the kind of contradiction that costs a pack its credibility.
  const teamsSignedOff = requiredTeams.filter(
    (t) =>
      !t.hasCriticalBlocker &&
      (getAssessment(t.teamId).decision === 'Approved' ||
        getAssessment(t.teamId).decision === 'Approved with Conditions'),
  ).length;
  const teamsBlocked = requiredTeams.filter((t) => t.hasCriticalBlocker).length;
  const teamsNotStarted = requiredTeams.length - startedTeams.length;

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
    teamsSignedOff,
    teamsBlocked,
    teamsNotStarted,
    requiredTeams: requiredTeams.length,
    coverage,
    certification: cert,
    perTeam,
  };
}

/** Convenience for callers that only have a plain assessment map. */
export function computeScoreFromMap(
  profile: Profile,
  lenses: TeamLens[],
  assessments: Record<string, TeamAssessment | undefined>,
  certification?: Certification,
): ScoreResult {
  return computeScore({
    profile,
    lenses,
    getAssessment: (teamId) => assessments[teamId] ?? makeEmptyAssessment(teamId),
    certification,
  });
}

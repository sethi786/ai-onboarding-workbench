import type { Decision, Profile, TeamAssessment, TeamId, TeamLens } from '../types';

/**
 * Assessment memory: answering a review from the reviews you already did.
 *
 * The tenth tool a workspace reviews asks most of the same questions as the
 * first nine. Somebody already worked out how SSO is enforced, what the DPA
 * says, where the data lands — and today all of that is locked inside a
 * finished evaluation nobody opens again, so review ten starts as cold as
 * review one.
 *
 * This is the part of the product that should get better the more it is used.
 * Everything here is deterministic: candidates are found by exact control id
 * and ranked by how alike the two tools actually are, so it works with no API
 * key and costs nothing per lookup. The AI layer sits on top and adapts the
 * wording; it is an enhancement, not the mechanism.
 *
 * A recollection is always a suggestion to verify, never an automatic answer.
 * A control silently ticked because a different tool once satisfied it is
 * exactly the failure this product exists to prevent.
 */

/** One finished lens assessment from an earlier evaluation in the same workspace. */
export interface PriorAssessment {
  evaluationId: string;
  toolName: string;
  reviewedAt: string;
  profile: Profile;
  teamId: TeamId;
  checkedControls: Record<string, boolean>;
  checkedEvidence: Record<string, boolean>;
  notes: string;
  residualRisk: string;
  decision: Decision;
}

export interface Similarity {
  /** 0..1 — how much these two tools have in common. */
  score: number;
  /** Plain-language reasons, for the reviewer deciding whether to trust it. */
  reasons: string[];
}

export interface Recollection {
  /** The control or evidence id this recalls an answer for. */
  itemId: string;
  kind: 'control' | 'evidence';
  source: { evaluationId: string; toolName: string; reviewedAt: string };
  similarity: Similarity;
  /** The reviewer's note on that lens, when there was one worth carrying over. */
  note?: string;
}

/**
 * Below this, two tools have too little in common for a prior answer to mean
 * anything. Suggesting at 0.2 would bury the good matches in noise, and a
 * suggestion the reviewer learns to dismiss is worse than none.
 */
export const RECALL_THRESHOLD = 0.35;

interface Dimension {
  weight: number;
  matches: (a: Profile, b: Profile) => boolean;
  reason: string;
}

/**
 * What makes a prior answer transferable.
 *
 * Vendor dominates on purpose: the same vendor's SSO story, subprocessor list,
 * and data residency are the same answer twice, and those are the questions
 * reviewers re-answer most often. Everything else adjusts around it.
 */
const DIMENSIONS: Dimension[] = [
  {
    weight: 0.4,
    matches: (a, b) => norm(a.platform) === norm(b.platform) && norm(a.platform) !== '',
    reason: 'same vendor',
  },
  { weight: 0.18, matches: (a, b) => a.toolCategory === b.toolCategory, reason: 'same kind of tool' },
  { weight: 0.09, matches: (a, b) => a.toolType === b.toolType, reason: 'same tool type' },
  { weight: 0.09, matches: (a, b) => a.selfHosted === b.selfHosted, reason: 'same hosting model' },
  {
    weight: 0.08,
    matches: (a, b) => a.dataClassification === b.dataClassification,
    reason: 'same data classification',
  },
  { weight: 0.06, matches: (a, b) => a.connectorEnabled === b.connectorEnabled, reason: 'same integration posture' },
  { weight: 0.04, matches: (a, b) => a.ragEnabled === b.ragEnabled, reason: 'same retrieval posture' },
  { weight: 0.04, matches: (a, b) => a.agentEnabled === b.agentEnabled, reason: 'same agent posture' },
  { weight: 0.02, matches: (a, b) => a.pii === b.pii, reason: 'same personal-data exposure' },
];

function norm(s: string): string {
  return (s ?? '').trim().toLowerCase();
}

export function similarity(a: Profile, b: Profile): Similarity {
  let score = 0;
  const reasons: string[] = [];
  for (const d of DIMENSIONS) {
    if (d.matches(a, b)) {
      score += d.weight;
      reasons.push(d.reason);
    }
  }
  return { score: Math.min(1, score), reasons };
}

/** Most-alike first; ties broken by recency, because newer answers age better. */
function rank(current: Profile, priors: PriorAssessment[]): { prior: PriorAssessment; sim: Similarity }[] {
  return priors
    .map((prior) => ({ prior, sim: similarity(current, prior.profile) }))
    .filter((x) => x.sim.score >= RECALL_THRESHOLD)
    .sort((a, b) =>
      b.sim.score - a.sim.score || b.prior.reviewedAt.localeCompare(a.prior.reviewedAt),
    );
}

/**
 * What this workspace already knows about one lens of one tool.
 *
 * Only answers marked satisfied are recalled. An unanswered control in a prior
 * review carries no information — it may simply never have been reached.
 */
export function recallForLens(
  lens: TeamLens,
  current: Profile,
  history: PriorAssessment[],
  opts: { controlIds: string[]; evidenceIds: string[] },
): Recollection[] {
  const ranked = rank(
    current,
    history.filter((h) => h.teamId === lens.id && h.evaluationId !== current.id),
  );
  if (ranked.length === 0) return [];

  const out: Recollection[] = [];

  const best = (
    ids: string[],
    kind: 'control' | 'evidence',
    pick: (p: PriorAssessment) => Record<string, boolean>,
  ) => {
    for (const itemId of ids) {
      const hit = ranked.find(({ prior }) => pick(prior)[itemId]);
      if (!hit) continue;
      out.push({
        itemId,
        kind,
        source: {
          evaluationId: hit.prior.evaluationId,
          toolName: hit.prior.toolName,
          reviewedAt: hit.prior.reviewedAt,
        },
        similarity: hit.sim,
        note: hit.prior.notes || undefined,
      });
    }
  };

  best(opts.controlIds, 'control', (p) => p.checkedControls);
  best(opts.evidenceIds, 'evidence', (p) => p.checkedEvidence);
  return out;
}

export interface RecallSummary {
  /** Recollections keyed by the control or evidence id they answer. */
  byItem: Record<string, Recollection>;
  controlCount: number;
  evidenceCount: number;
  /** Distinct earlier reviews these answers came from, most-alike first. */
  sources: { evaluationId: string; toolName: string; score: number }[];
}

export function summarizeRecall(recollections: Recollection[]): RecallSummary {
  const byItem: Record<string, Recollection> = {};
  const sources = new Map<string, { evaluationId: string; toolName: string; score: number }>();

  for (const r of recollections) {
    byItem[r.itemId] = r;
    const existing = sources.get(r.source.evaluationId);
    if (!existing || r.similarity.score > existing.score) {
      sources.set(r.source.evaluationId, {
        evaluationId: r.source.evaluationId,
        toolName: r.source.toolName,
        score: r.similarity.score,
      });
    }
  }

  return {
    byItem,
    controlCount: recollections.filter((r) => r.kind === 'control').length,
    evidenceCount: recollections.filter((r) => r.kind === 'evidence').length,
    sources: [...sources.values()].sort((a, b) => b.score - a.score),
  };
}

/**
 * Apply a set of recollections to an assessment.
 *
 * Never overwrites: anything the reviewer already answered stays as they left
 * it, so accepting history can only ever add. Returns the ids actually applied
 * so the UI can report what changed rather than claiming a number.
 */
export function applyRecall(
  assessment: TeamAssessment,
  recollections: Recollection[],
): { patch: Partial<TeamAssessment>; appliedIds: string[] } {
  const checkedControls = { ...assessment.checkedControls };
  const checkedEvidence = { ...assessment.checkedEvidence };
  const appliedIds: string[] = [];

  for (const r of recollections) {
    const target = r.kind === 'control' ? checkedControls : checkedEvidence;
    if (target[r.itemId]) continue;
    target[r.itemId] = true;
    appliedIds.push(r.itemId);
  }

  return { patch: { checkedControls, checkedEvidence }, appliedIds };
}

/** How much of this lens the workspace can answer from memory, 0..1. */
export function recallCoverage(recollections: Recollection[], askedItemCount: number): number {
  if (askedItemCount === 0) return 0;
  return Math.min(1, recollections.length / askedItemCount);
}

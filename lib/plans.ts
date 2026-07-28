/**
 * Plan entitlements — the single source of truth for what each plan can do.
 *
 * Pure and framework-free so it can be unit-tested and imported from both server
 * actions (enforcement) and client components (presentation). Enforcement must
 * always happen server-side; the UI only mirrors what this module says.
 */

export type PlanId = 'free' | 'team' | 'enterprise';

/** Feature keys that can be gated. */
export type FeatureKey =
  | 'evidenceFactory'
  | 'exports'
  | 'toolLibrary'
  | 'workflow'
  | 'approvals'
  | 'customLenses'
  | 'sso';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  /** Display price; billing itself is not wired yet. */
  price: string;
  blurb: string;
  /** null = unlimited */
  maxEvaluations: number | null;
  maxMembers: number | null;
  features: Record<FeatureKey, boolean>;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  /**
   * Starter exists to let somebody finish one review end to end.
   *
   * It used to grant one capability of six: a trial user filled the intake by
   * hand, worked through the whole control set alone, and received nothing at
   * the end. That demonstrates the cost of governance and hides every reason to
   * pay for it. The limit is now volume and collaboration — one tool, three
   * people — not capability. Somebody who has held a finished, branded review
   * pack knows what they're buying; somebody who bounced off a paywall does not.
   */
  free: {
    id: 'free',
    name: 'Starter',
    price: '$0',
    blurb: 'Take one tool all the way through, free.',
    maxEvaluations: 1,
    maxMembers: 3,
    features: {
      evidenceFactory: true,
      exports: true,
      toolLibrary: true,
      workflow: true,
      approvals: true,
      customLenses: false,
      sso: false,
    },
  },
  team: {
    id: 'team',
    name: 'Team',
    price: '$499/mo',
    blurb: 'For governance and AI program teams.',
    maxEvaluations: null,
    maxMembers: 25,
    features: {
      evidenceFactory: true,
      exports: true,
      toolLibrary: true,
      workflow: true,
      approvals: true,
      customLenses: false,
      sso: false,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    blurb: 'For regulated organizations at scale.',
    maxEvaluations: null,
    maxMembers: null,
    features: {
      evidenceFactory: true,
      exports: true,
      toolLibrary: true,
      workflow: true,
      approvals: true,
      customLenses: true,
      sso: true,
    },
  },
};

/** Human labels for gated features, used in upgrade prompts. */
export const FEATURE_LABELS: Record<FeatureKey, string> = {
  evidenceFactory: 'Evidence Factory',
  exports: 'Exports',
  toolLibrary: 'Tool Library',
  workflow: 'Workflow',
  approvals: 'Approvals',
  customLenses: 'Custom lenses',
  sso: 'SSO / SCIM',
};

/**
 * Normalize whatever is stored on the organization row into a known plan.
 * Unknown or missing values fall back to the most restrictive plan — failing
 * closed is the correct default for an entitlement check.
 */
export function toPlanId(raw: string | null | undefined): PlanId {
  const v = (raw ?? '').trim().toLowerCase();
  if (v === 'team' || v === 'pro') return 'team';
  if (v === 'enterprise') return 'enterprise';
  return 'free';
}

export function getPlan(raw: string | null | undefined): PlanDefinition {
  return PLANS[toPlanId(raw)];
}

export function hasFeature(raw: string | null | undefined, feature: FeatureKey): boolean {
  return getPlan(raw).features[feature];
}

export interface QuotaState {
  used: number;
  limit: number | null;
  /** True when another item may be created. */
  allowed: boolean;
  /** Remaining slots, or null when unlimited. */
  remaining: number | null;
}

export function evaluationQuota(raw: string | null | undefined, used: number): QuotaState {
  const limit = getPlan(raw).maxEvaluations;
  if (limit === null) return { used, limit: null, allowed: true, remaining: null };
  const remaining = Math.max(0, limit - used);
  return { used, limit, allowed: used < limit, remaining };
}

export function memberQuota(raw: string | null | undefined, used: number): QuotaState {
  const limit = getPlan(raw).maxMembers;
  if (limit === null) return { used, limit: null, allowed: true, remaining: null };
  const remaining = Math.max(0, limit - used);
  return { used, limit, allowed: used < limit, remaining };
}

/** The plan a workspace should move to in order to unlock `feature`. */
export function upgradeTargetFor(feature: FeatureKey): PlanDefinition {
  if (PLANS.team.features[feature]) return PLANS.team;
  return PLANS.enterprise;
}

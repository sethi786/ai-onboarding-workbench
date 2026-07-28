import 'server-only';
import { createClient } from '@/lib/supabase/server';
import {
  evaluationQuota,
  memberQuota,
  hasFeature,
  getPlan,
  FEATURE_LABELS,
  type FeatureKey,
  type QuotaState,
} from '@/lib/plans';

/**
 * Server-side entitlement checks. The UI mirrors these, but this module is the
 * enforcement point — every mutation that consumes a limited resource must call
 * through here before writing.
 */

/** Count evaluations in an org. RLS scopes the count to the caller's org access. */
export async function countEvaluations(orgId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('evaluations')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function countMembers(orgId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('memberships')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getEvaluationQuota(orgId: string, plan: string): Promise<QuotaState> {
  return evaluationQuota(plan, await countEvaluations(orgId));
}

export async function getMemberQuota(orgId: string, plan: string): Promise<QuotaState> {
  return memberQuota(plan, await countMembers(orgId));
}

/**
 * Guard for creating an evaluation. Returns an error message when the workspace
 * is at its plan limit, or null when the write may proceed.
 */
export async function assertEvaluationQuota(
  orgId: string,
  plan: string,
): Promise<string | null> {
  const quota = await getEvaluationQuota(orgId, plan);
  if (quota.allowed) return null;
  const p = getPlan(plan);
  return `Your ${p.name} plan includes ${quota.limit} evaluations and you're using ${quota.used}. Upgrade to add more, or delete an existing evaluation.`;
}

/**
 * Guard for a gated feature. Returns an error message when the plan does not
 * include it, or null when access is permitted.
 */
export function assertFeature(plan: string, feature: FeatureKey): string | null {
  if (hasFeature(plan, feature)) return null;
  return `${FEATURE_LABELS[feature]} isn't included in the ${getPlan(plan).name} plan. Upgrade to unlock it.`;
}

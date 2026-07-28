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

/**
 * Resolve a workspace's plan. RLS restricts this read to orgs the caller belongs
 * to, so a missing row also means "not a member of this workspace" — callers can
 * treat `null` as both "no such workspace" and "no access".
 */
export async function getOrgPlan(orgId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .maybeSingle();
  return data?.plan ?? null;
}

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
 * Guard for adding a seat. Pending invitations count against the limit as well
 * as accepted memberships — otherwise a workspace could invite past its plan and
 * only discover the overage once everyone had signed up.
 */
export async function assertMemberQuota(orgId: string, plan: string): Promise<string | null> {
  const supabase = await createClient();
  const [members, pending] = await Promise.all([
    countMembers(orgId),
    supabase
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .is('accepted_at', null),
  ]);
  const quota = memberQuota(plan, members + (pending.count ?? 0));
  if (quota.allowed) return null;
  const p = getPlan(plan);
  const seats = quota.limit === 1 ? 'seat' : 'seats';
  return `Your ${p.name} plan includes ${quota.limit} ${seats} and ${quota.used} are taken (including pending invitations). Upgrade to invite more people.`;
}

/**
 * Guard for a gated feature. Returns an error message when the plan does not
 * include it, or null when access is permitted.
 */
export function assertFeature(plan: string, feature: FeatureKey): string | null {
  if (hasFeature(plan, feature)) return null;
  return `${FEATURE_LABELS[feature]} isn't included in the ${getPlan(plan).name} plan. Upgrade to unlock it.`;
}

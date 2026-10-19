import { createClient } from '@/lib/supabase/server';
import { requireUser } from './require-user';
import { canEdit, canDeleteEvaluation } from '@/lib/rbac';

/** Bind the caller, URL workspace, and actual parent before a mutation; RLS still applies. */
export async function authorizeWorkspace(orgId: string, orgSlug: string, admin = false) {
  const user = await requireUser();
  const supabase = await createClient();
  const [org, membership] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', orgId).eq('slug', orgSlug).maybeSingle(),
    supabase.from('memberships').select('role').eq('org_id', orgId).eq('user_id', user.id).maybeSingle(),
  ]);
  if (org.error || membership.error) return { error: 'Could not verify workspace access. Please retry.' } as const;
  if (!org.data || !membership.data || !(admin ? canDeleteEvaluation(membership.data.role) : canEdit(membership.data.role))) return { error: 'You do not have permission to make this change in this workspace.' } as const;
  return { supabase, user, org: org.data } as const;
}

export async function authorizeEvaluation(evalId: string, orgSlug: string, orgId?: string, admin = false) {
  await requireUser();
  const supabase = await createClient();
  const { data: evaluation, error } = await supabase.from('evaluations').select('*').eq('id', evalId).maybeSingle();
  if (error || !evaluation || (orgId !== undefined && evaluation.org_id !== orgId)) return { error: 'Evaluation not found in this workspace.' } as const;
  const access = await authorizeWorkspace(evaluation.org_id, orgSlug, admin);
  if ('error' in access) return { error: access.error ?? 'Could not verify workspace access.' } as const;
  return { ...access, evaluation } as const;
}

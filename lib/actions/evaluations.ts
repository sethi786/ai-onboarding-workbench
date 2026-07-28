'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';
import { assertEvaluationQuota } from '@/lib/auth/entitlements';
import { profilePatchToRow } from '@/lib/db/mappers';
import { makeDefaultWorkflow } from '@/workbench/data/workflowStages';
import type { Profile } from '@/workbench/types';

async function seedWorkflow(evalId: string, orgId: string) {
  const supabase = await createClient();
  const rows = makeDefaultWorkflow().map((s) => ({
    org_id: orgId,
    evaluation_id: evalId,
    stage_key: s.id,
    ordinal: s.order,
    name: s.name,
    status: s.status,
    decision: s.decision,
  }));
  await supabase.from('workflow_stages').insert(rows);
}

/**
 * Resolve a workspace's plan. RLS restricts this read to orgs the caller belongs
 * to, so a missing row also means "not a member of this workspace".
 */
async function getOrgPlan(orgId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .maybeSingle();
  return data?.plan ?? null;
}

export async function createEvaluation(
  orgId: string,
  orgSlug: string,
  input: Partial<Profile> & { name: string },
): Promise<{ error?: string; id?: string }> {
  const user = await requireUser();

  const plan = await getOrgPlan(orgId);
  if (plan === null) return { error: 'Workspace not found.' };

  const quotaError = await assertEvaluationQuota(orgId, plan);
  if (quotaError) return { error: quotaError };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('evaluations')
    .insert({ org_id: orgId, created_by: user.id, ...profilePatchToRow(input), name: input.name })
    .select('id')
    .single();
  if (error || !data) return { error: error?.message ?? 'Could not create evaluation.' };

  await seedWorkflow(data.id, orgId);
  revalidatePath(`/portal/${orgSlug}/evaluations`);
  redirect(`/portal/${orgSlug}/evaluations/${data.id}`);
}

export async function updateEvaluation(
  evalId: string,
  orgSlug: string,
  patch: Partial<Profile>,
): Promise<{ error?: string }> {
  await requireUser();
  const supabase = await createClient();
  // Return the affected row so an RLS-blocked write surfaces as an error rather
  // than a silent no-op (PostgREST reports zero rows, not a failure).
  const { data, error } = await supabase
    .from('evaluations')
    .update(profilePatchToRow(patch))
    .eq('id', evalId)
    .select('id');
  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: 'You don’t have permission to edit this evaluation.' };
  }
  revalidatePath(`/portal/${orgSlug}/evaluations/${evalId}`, 'layout');
  return {};
}

export async function deleteEvaluation(
  evalId: string,
  orgSlug: string,
): Promise<{ error?: string }> {
  await requireUser();
  const supabase = await createClient();
  // Same reasoning as updateEvaluation: a delete blocked by RLS comes back as
  // success with zero rows, so check what was actually removed before
  // redirecting the user as though it worked.
  const { data, error } = await supabase
    .from('evaluations')
    .delete()
    .eq('id', evalId)
    .select('id');
  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: 'You don’t have permission to delete this evaluation.' };
  }
  revalidatePath(`/portal/${orgSlug}/evaluations`);
  redirect(`/portal/${orgSlug}/evaluations`);
}

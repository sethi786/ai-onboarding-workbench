'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authorizeWorkspace, authorizeEvaluation } from '@/lib/auth/evaluation-access';
import { validateProfilePatch } from '@/lib/validation/governance';
import { assertEvaluationQuota } from '@/lib/auth/entitlements';
import { profilePatchToRow } from '@/lib/db/mappers';
import type { Profile } from '@/workbench/types';

export async function createEvaluation(
  orgId: string,
  orgSlug: string,
  input: Partial<Profile> & { name: string },
): Promise<{ error?: string; id?: string }> {
  const invalid = validateProfilePatch(input);
  if (invalid || !input.name?.trim()) return { error: invalid ?? 'Name is required.' };
  const access = await authorizeWorkspace(orgId, orgSlug);
  if ('error' in access) return { error: access.error };
  const { supabase, user, org } = access;
  const plan = org.plan;

  const quotaError = await assertEvaluationQuota(orgId, plan);
  if (quotaError) return { error: quotaError };

  const { data, error } = await supabase
    .from('evaluations')
    .insert({ org_id: orgId, created_by: user.id, ...profilePatchToRow(input), name: input.name })
    .select('id')
    .single();
  if (error || !data) return { error: error?.message ?? 'Could not create evaluation.' };

  revalidatePath(`/portal/${orgSlug}/evaluations`);
  redirect(`/portal/${orgSlug}/evaluations/${data.id}`);
}

export async function updateEvaluation(
  evalId: string,
  orgSlug: string,
  patch: Partial<Profile>,
): Promise<{ error?: string }> {
  const invalid = validateProfilePatch(patch);
  if (invalid) return { error: invalid };
  const access = await authorizeEvaluation(evalId, orgSlug);
  if ('error' in access) return { error: access.error };
  const { supabase } = access;
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
  revalidatePath(`/portal/${orgSlug}/dashboard`);
  revalidatePath(`/portal/${orgSlug}/evaluations`);
  return {};
}

export async function deleteEvaluation(
  evalId: string,
  orgSlug: string,
): Promise<{ error?: string }> {
  const access = await authorizeEvaluation(evalId, orgSlug, undefined, true);
  if ('error' in access) return { error: access.error };
  const { supabase } = access;
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

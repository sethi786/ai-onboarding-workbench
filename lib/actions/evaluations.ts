'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';
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

export async function createEvaluation(
  orgId: string,
  orgSlug: string,
  input: Partial<Profile> & { name: string },
): Promise<{ error?: string; id?: string }> {
  const user = await requireUser();
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
  const { error } = await supabase.from('evaluations').update(profilePatchToRow(patch)).eq('id', evalId);
  if (error) return { error: error.message };
  revalidatePath(`/portal/${orgSlug}/evaluations/${evalId}`, 'layout');
  return {};
}

export async function deleteEvaluation(evalId: string, orgSlug: string): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  await supabase.from('evaluations').delete().eq('id', evalId);
  revalidatePath(`/portal/${orgSlug}/evaluations`);
  redirect(`/portal/${orgSlug}/evaluations`);
}

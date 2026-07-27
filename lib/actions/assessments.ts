'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';
import { assessmentPatchToRow } from '@/lib/db/mappers';
import type { TeamAssessment, TeamId } from '@/workbench/types';

/** Upsert one lens's assessment row. org_id is required (denormalized + RLS). */
export async function updateAssessment(
  evalId: string,
  orgId: string,
  orgSlug: string,
  teamId: TeamId,
  patch: Partial<TeamAssessment>,
): Promise<{ error?: string }> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from('team_assessments')
    .upsert(
      {
        org_id: orgId,
        evaluation_id: evalId,
        team_id: teamId,
        ...assessmentPatchToRow(patch),
      },
      { onConflict: 'evaluation_id,team_id' },
    );
  if (error) return { error: error.message };
  revalidatePath(`/portal/${orgSlug}/evaluations/${evalId}`, 'layout');
  return {};
}

export async function addEvidenceLink(
  evalId: string,
  orgId: string,
  orgSlug: string,
  teamId: TeamId,
  label: string,
  url: string,
): Promise<{ error?: string }> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from('evidence_links')
    .insert({ org_id: orgId, evaluation_id: evalId, team_id: teamId, label, url });
  if (error) return { error: error.message };
  revalidatePath(`/portal/${orgSlug}/evaluations/${evalId}`, 'layout');
  return {};
}

export async function removeEvidenceLink(
  linkId: string,
  evalId: string,
  orgSlug: string,
): Promise<{ error?: string }> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from('evidence_links').delete().eq('id', linkId);
  if (error) return { error: error.message };
  revalidatePath(`/portal/${orgSlug}/evaluations/${evalId}`, 'layout');
  return {};
}

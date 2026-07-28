'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';
import { assessmentPatchToRow } from '@/lib/db/mappers';
import { recordAudit } from '@/lib/audit';
import { LENS_BY_ID } from '@/workbench/data/teamLenses';
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
  // Select the affected row: an upsert blocked by RLS comes back from PostgREST
  // as success with zero rows, so without this a viewer sees "Changes saved"
  // while nothing was written.
  const { data, error } = await supabase
    .from('team_assessments')
    .upsert(
      {
        org_id: orgId,
        evaluation_id: evalId,
        team_id: teamId,
        ...assessmentPatchToRow(patch),
      },
      { onConflict: 'evaluation_id,team_id' },
    )
    .select('id');
  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: 'You don\u2019t have permission to edit this evaluation.' };
  }
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
  const { data, error } = await supabase
    .from('evidence_links')
    .delete()
    .eq('id', linkId)
    .select('id');
  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: 'You don\u2019t have permission to remove this evidence link.' };
  }
  revalidatePath(`/portal/${orgSlug}/evaluations/${evalId}`, 'layout');
  return {};
}

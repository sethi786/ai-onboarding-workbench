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

/** Toggle a key inside one of the jsonb maps (controls/evidence/blockers). */
export async function toggleFlag(
  evalId: string,
  orgId: string,
  orgSlug: string,
  teamId: TeamId,
  field: 'checked_controls' | 'checked_evidence' | 'active_blockers',
  key: string,
): Promise<{ error?: string }> {
  await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from('team_assessments')
    .select('checked_controls, checked_evidence, active_blockers')
    .eq('evaluation_id', evalId)
    .eq('team_id', teamId)
    .maybeSingle();

  const existing = (data?.[field] as Record<string, boolean> | undefined) ?? {};
  const nextMap = { ...existing, [key]: !existing[key] };

  const { error } = await supabase
    .from('team_assessments')
    .upsert(
      { org_id: orgId, evaluation_id: evalId, team_id: teamId, [field]: nextMap },
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

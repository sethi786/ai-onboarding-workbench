'use server';

import { revalidatePath } from 'next/cache';
import { authorizeEvaluation } from '@/lib/auth/evaluation-access';
import { assessmentPatchToRow } from '@/lib/db/mappers';
import { validateAssessmentPatch, validDate } from '@/lib/validation/governance';
import { isSafeEvidenceUrl } from '@/workbench/engine/evidence';
import { LENS_BY_ID } from '@/workbench/data/teamLenses';
import type { TeamAssessment, TeamId } from '@/workbench/types';

function refresh(orgSlug: string, evalId: string) {
  revalidatePath(`/portal/${orgSlug}/evaluations/${evalId}`, 'layout');
  revalidatePath(`/portal/${orgSlug}/dashboard`);
  revalidatePath(`/portal/${orgSlug}/evaluations`);
}

export async function updateAssessment(evalId: string, orgId: string, orgSlug: string, teamId: TeamId, patch: Partial<TeamAssessment>): Promise<{ error?: string }> {
  const invalid = validateAssessmentPatch(teamId, patch);
  if (invalid) return { error: invalid };
  const access = await authorizeEvaluation(evalId, orgSlug, orgId);
  if ('error' in access) return { error: access.error };
  const { data, error } = await access.supabase.from('team_assessments').upsert({
    org_id: access.org.id, evaluation_id: evalId, team_id: teamId, ...assessmentPatchToRow(patch),
  }, { onConflict: 'evaluation_id,team_id' }).select('id');
  if (error || !data?.length) return { error: error?.message ?? 'Assessment was not saved. Please reload and retry.' };
  refresh(orgSlug, evalId);
  return {};
}

/** Explicit acknowledgement; never silently revalidates an old assessment on an edit. */
export async function confirmAssessmentScope(evalId: string, orgSlug: string, teamId: TeamId, expectedRevision: number): Promise<{ error?: string }> {
  if (!Object.hasOwn(LENS_BY_ID, teamId)) return { error: 'Unknown review team.' };
  const access = await authorizeEvaluation(evalId, orgSlug);
  if ('error' in access) return { error: access.error };
  if (access.evaluation.scope_revision !== expectedRevision) return { error: 'Scope changed again. Reload and review the latest scope.' };
  const { data, error } = await access.supabase.from('team_assessments').upsert({
    org_id: access.org.id, evaluation_id: evalId, team_id: teamId, scope_revision: expectedRevision,
  }, { onConflict: 'evaluation_id,team_id' }).select('id');
  if (error || !data?.length) return { error: error?.message ?? 'Scope confirmation was not saved.' };
  refresh(orgSlug, evalId);
  return {};
}

export async function addEvidenceLink(evalId: string, orgId: string, orgSlug: string, teamId: TeamId, label: string, url: string, evidenceId: string, expiresOn: string, expectedRevision: number): Promise<{ error?: string }> {
  const lens = Object.hasOwn(LENS_BY_ID, teamId) ? LENS_BY_ID[teamId] : undefined;
  if (!lens?.evidenceRequired.some((e) => e.id === evidenceId)) return { error: 'Select a valid evidence requirement.' };
  if (typeof label !== 'string' || !label.trim() || label.length > 200 || !isSafeEvidenceUrl(url) || !validDate(expiresOn)) return { error: 'Provide a label, an HTTP(S) URL without credentials, and a valid optional expiry date.' };
  const access = await authorizeEvaluation(evalId, orgSlug, orgId);
  if ('error' in access) return { error: access.error };
  if (access.evaluation.scope_revision !== expectedRevision) return { error: 'Scope changed. Reload and check the reference against the latest scope.' };
  const { data, error } = await access.supabase.from('evidence_links').insert({
    org_id: access.org.id, evaluation_id: evalId, team_id: teamId, label: label.trim(), url: url.trim(),
    evidence_id: evidenceId, scope_revision: access.evaluation.scope_revision, expires_on: expiresOn || null,
  }).select('id');
  if (error || !data?.length) return { error: error?.message ?? 'Evidence was not saved.' };
  refresh(orgSlug, evalId);
  return {};
}

export async function removeEvidenceLink(linkId: string, evalId: string, orgSlug: string): Promise<{ error?: string }> {
  const access = await authorizeEvaluation(evalId, orgSlug);
  if ('error' in access) return { error: access.error };
  const { data, error } = await access.supabase.from('evidence_links').delete().eq('id', linkId).eq('evaluation_id', evalId).eq('org_id', access.org.id).select('id');
  if (error || !data?.length) return { error: error?.message ?? 'Evidence was not removed. Reload and retry.' };
  refresh(orgSlug, evalId);
  return {};
}

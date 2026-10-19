'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authorizeWorkspace } from '@/lib/auth/evaluation-access';
import { assertEvaluationQuota, assertFeature } from '@/lib/auth/entitlements';
import { profilePatchToRow, assessmentPatchToRow } from '@/lib/db/mappers';
import { makeEmptyAssessment } from '@/workbench/types';
import type { TeamId } from '@/workbench/types';
import { TOOL_TEMPLATE_BY_ID } from '@/data/tool-templates';

/** Instantiate a library template into an org as a new, editable evaluation. */
export async function instantiateTemplate(
  orgId: string,
  orgSlug: string,
  templateId: string,
): Promise<{ error?: string }> {
  const access = await authorizeWorkspace(orgId, orgSlug);
  if ('error' in access) return { error: access.error };
  const { user, supabase, org } = access;
  const tpl = TOOL_TEMPLATE_BY_ID[templateId];
  if (!tpl) return { error: 'Unknown template.' };

  const featureError = assertFeature(org.plan, 'toolLibrary');
  if (featureError) return { error: featureError };

  const quotaError = await assertEvaluationQuota(orgId, org.plan);
  if (quotaError) return { error: quotaError };

  const { data: created, error } = await supabase
    .from('evaluations')
    .insert({
      org_id: orgId,
      created_by: user.id,
      name: tpl.name,
      platform: tpl.platform,
      tool_type: tpl.toolType,
      source_template_id: tpl.id,
      ...profilePatchToRow(tpl.defaults),
    })
    .select('id')
    .single();
  if (error || !created) return { error: error?.message ?? 'Could not create evaluation.' };

  const evalId = created.id;

  // Seed suggested lens assessments (starter notes/controls)
  const suggestedRows = Object.entries(tpl.suggested).map(([teamId, patch]) => {
    const base = makeEmptyAssessment(teamId as TeamId);
    return {
      org_id: orgId,
      evaluation_id: evalId,
      team_id: teamId,
      ...assessmentPatchToRow({ ...base, ...patch }),
    };
  });
  if (suggestedRows.length) {
    const { error: seedError } = await supabase.from('team_assessments').insert(suggestedRows);
    if (seedError) return { error: `Evaluation ${evalId} was created, but starter assessments failed. Open it from Evaluations; do not create a duplicate.` };
  }

  revalidatePath(`/portal/${orgSlug}/evaluations`);
  redirect(`/portal/${orgSlug}/evaluations/${evalId}`);
}

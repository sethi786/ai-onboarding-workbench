'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';
import { profilePatchToRow, assessmentPatchToRow } from '@/lib/db/mappers';
import { makeDefaultWorkflow } from '@/workbench/data/workflowStages';
import { makeEmptyAssessment } from '@/workbench/types';
import type { TeamId } from '@/workbench/types';
import { TOOL_TEMPLATE_BY_ID } from '@/data/tool-templates';

/** Instantiate a library template into an org as a new, editable evaluation. */
export async function instantiateTemplate(
  orgId: string,
  orgSlug: string,
  templateId: string,
): Promise<{ error?: string }> {
  const user = await requireUser();
  const tpl = TOOL_TEMPLATE_BY_ID[templateId];
  if (!tpl) return { error: 'Unknown template.' };

  const supabase = await createClient();

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

  // Seed the 25 workflow stages
  await supabase.from('workflow_stages').insert(
    makeDefaultWorkflow().map((s) => ({
      org_id: orgId,
      evaluation_id: evalId,
      stage_key: s.id,
      ordinal: s.order,
      name: s.name,
      status: s.status,
      decision: s.decision,
    })),
  );

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
  if (suggestedRows.length) await supabase.from('team_assessments').insert(suggestedRows);

  revalidatePath(`/portal/${orgSlug}/evaluations`);
  redirect(`/portal/${orgSlug}/evaluations/${evalId}`);
}

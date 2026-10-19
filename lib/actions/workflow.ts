'use server';

import { revalidatePath } from 'next/cache';
import { authorizeEvaluation } from '@/lib/auth/evaluation-access';
import { validateWorkflowPatch } from '@/lib/validation/governance';
import { makeDefaultWorkflow } from '@/workbench/data/workflowStages';
import type { WorkflowStage } from '@/workbench/types';

export async function updateWorkflowStage(
  evalId: string,
  orgSlug: string,
  stageKey: string,
  patch: Partial<Pick<WorkflowStage, 'status' | 'owner' | 'dueDate' | 'evidence' | 'notes' | 'blocker' | 'decision'>>,
): Promise<{ error?: string }> {
  const invalid = validateWorkflowPatch(patch);
  if (invalid) return { error: invalid };
  if (!makeDefaultWorkflow().some((s) => s.id === stageKey)) return { error: 'Unknown workflow stage.' };
  const access = await authorizeEvaluation(evalId, orgSlug);
  if ('error' in access) return { error: access.error };
  const { supabase } = access;
  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.owner !== undefined) row.owner = patch.owner;
  if (patch.dueDate !== undefined) row.due_date = patch.dueDate;
  if (patch.evidence !== undefined) row.evidence = patch.evidence;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.blocker !== undefined) row.blocker = patch.blocker;
  if (patch.decision !== undefined) row.decision = patch.decision;

  const { data, error } = await supabase
    .from('workflow_stages')
    .update(row)
    .eq('evaluation_id', evalId)
    .eq('stage_key', stageKey).select('id');
  if (error || !data?.length) return { error: error?.message ?? 'Workflow change was not saved. Reload and retry.' };
  revalidatePath(`/portal/${orgSlug}/evaluations/${evalId}/workflow`);
  return {};
}

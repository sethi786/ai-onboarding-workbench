'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';
import type { WorkflowStage } from '@/workbench/types';

export async function updateWorkflowStage(
  evalId: string,
  orgSlug: string,
  stageKey: string,
  patch: Partial<Pick<WorkflowStage, 'status' | 'owner' | 'dueDate' | 'evidence' | 'notes' | 'blocker' | 'decision'>>,
): Promise<{ error?: string }> {
  await requireUser();
  const supabase = await createClient();
  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.owner !== undefined) row.owner = patch.owner;
  if (patch.dueDate !== undefined) row.due_date = patch.dueDate;
  if (patch.evidence !== undefined) row.evidence = patch.evidence;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.blocker !== undefined) row.blocker = patch.blocker;
  if (patch.decision !== undefined) row.decision = patch.decision;

  const { error } = await supabase
    .from('workflow_stages')
    .update(row)
    .eq('evaluation_id', evalId)
    .eq('stage_key', stageKey);
  if (error) return { error: error.message };
  revalidatePath(`/portal/${orgSlug}/evaluations/${evalId}/workflow`);
  return {};
}

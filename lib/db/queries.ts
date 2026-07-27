import { createClient } from '@/lib/supabase/server';
import { TEAM_LENSES } from '@/workbench/data/teamLenses';
import type { TeamAssessment, TeamId, WorkflowStage } from '@/workbench/types';
import { rowToProfile, rowToTeamAssessment, rowToWorkflowStage, makeEmptyAssessment } from './mappers';
import type { EvaluationRow, GeneratedReportRow } from './types';

export async function listEvaluations(orgId: string): Promise<EvaluationRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('evaluations')
    .select('*')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false });
  return data ?? [];
}

export async function getEvaluation(evalId: string): Promise<EvaluationRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('evaluations').select('*').eq('id', evalId).maybeSingle();
  return data ?? null;
}

/**
 * Rebuilds the exact Record<TeamId, TeamAssessment> the pure engine consumes.
 * Unfilled lenses fall back to makeEmptyAssessment (mirrors the old store).
 */
export async function loadAssessmentMap(
  evalId: string,
): Promise<Record<TeamId, TeamAssessment>> {
  const supabase = await createClient();
  const [{ data: rows }, { data: links }] = await Promise.all([
    supabase.from('team_assessments').select('*').eq('evaluation_id', evalId),
    supabase.from('evidence_links').select('*').eq('evaluation_id', evalId),
  ]);

  const map = {} as Record<TeamId, TeamAssessment>;
  for (const lens of TEAM_LENSES) map[lens.id] = makeEmptyAssessment(lens.id);
  for (const row of rows ?? []) {
    const myLinks = (links ?? []).filter((l) => l.team_id === row.team_id);
    map[row.team_id as TeamId] = rowToTeamAssessment(row, myLinks);
  }
  return map;
}

export async function getWorkflow(evalId: string): Promise<WorkflowStage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('workflow_stages')
    .select('*')
    .eq('evaluation_id', evalId)
    .order('ordinal', { ascending: true });
  return (data ?? []).map(rowToWorkflowStage);
}

export async function listReports(evalId: string): Promise<GeneratedReportRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('generated_reports')
    .select('*')
    .eq('evaluation_id', evalId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export { rowToProfile };

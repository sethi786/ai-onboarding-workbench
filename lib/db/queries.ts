import { createClient } from '@/lib/supabase/server';
import { TEAM_LENSES } from '@/workbench/data/teamLenses';
import type { TeamAssessment, TeamId, WorkflowStage } from '@/workbench/types';
import { rowToProfile, rowToTeamAssessment, rowToWorkflowStage, makeEmptyAssessment } from './mappers';
import type { EvaluationRow, GeneratedReportRow } from './types';

export async function listEvaluations(orgId: string): Promise<EvaluationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false });
  if (error) throw new Error('Could not load evaluations. Please retry.');
  return data ?? [];
}

export async function getEvaluation(evalId: string): Promise<EvaluationRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('evaluations').select('*').eq('id', evalId).maybeSingle();
  if (error) throw new Error('Could not load the evaluation. Please retry.');
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
  const [{ data: rows, error: assessmentError }, { data: links, error: evidenceError }] = await Promise.all([
    supabase.from('team_assessments').select('*').eq('evaluation_id', evalId),
    supabase.from('evidence_links').select('*').eq('evaluation_id', evalId),
  ]);

  if (assessmentError || evidenceError) throw new Error('Could not load assessment evidence. Please retry.');
  const map = {} as Record<TeamId, TeamAssessment>;
  for (const lens of TEAM_LENSES) {
    const row = rows?.find((r) => r.team_id === lens.id);
    const myLinks = (links ?? []).filter((l) => l.team_id === lens.id);
    map[lens.id] = row ? rowToTeamAssessment(row, myLinks) : {
      ...makeEmptyAssessment(lens.id),
      evidenceLinks: myLinks.map((l) => ({ id: l.id, label: l.label, url: l.url, evidenceId: l.evidence_id, scopeRevision: l.scope_revision, expiresOn: l.expires_on ?? '' })),
    };
  }
  return map;
}

export async function getWorkflow(evalId: string): Promise<WorkflowStage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workflow_stages')
    .select('*')
    .eq('evaluation_id', evalId)
    .order('ordinal', { ascending: true });
  if (error) throw new Error('Could not load workflow. Please retry.');
  return (data ?? []).map(rowToWorkflowStage);
}

export async function listReports(evalId: string): Promise<GeneratedReportRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('generated_reports')
    .select('*')
    .eq('evaluation_id', evalId)
    .order('created_at', { ascending: false });
  if (error) throw new Error('Could not load reports. Please retry.');
  return data ?? [];
}

export { rowToProfile };

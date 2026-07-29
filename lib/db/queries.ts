import { createClient } from '@/lib/supabase/server';
import { TEAM_LENSES } from '@/workbench/data/teamLenses';
import type { TeamAssessment, TeamId, WorkflowStage } from '@/workbench/types';
import type { PriorAssessment } from '@/workbench/engine/memory';
import { rowToProfile, rowToTeamAssessment, rowToWorkflowStage, makeEmptyAssessment } from './mappers';
import type { Database, EvaluationRow, GeneratedReportRow } from './types';

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

/**
 * Every finished lens assessment in the workspace, for assessment memory.
 *
 * One query rather than per-lens lookups: a workspace with forty evaluations
 * would otherwise issue hundreds of round trips to render one page. RLS scopes
 * this to the caller's org, so a workspace can only ever recall its own answers.
 */
export async function loadOrgHistory(
  orgId: string,
  excludeEvalId?: string,
): Promise<PriorAssessment[]> {
  const supabase = await createClient();
  const [{ data: evaluations }, { data: rows }] = await Promise.all([
    supabase.from('evaluations').select('*').eq('org_id', orgId),
    supabase.from('team_assessments').select('*').eq('org_id', orgId),
  ]);

  const byId = new Map((evaluations ?? []).map((e) => [e.id, e]));

  return (rows ?? [])
    .filter((r) => r.evaluation_id !== excludeEvalId && byId.has(r.evaluation_id))
    .map((r) => {
      const evalRow = byId.get(r.evaluation_id)!;
      const a = rowToTeamAssessment(r, []);
      return {
        evaluationId: r.evaluation_id,
        toolName: evalRow.name,
        reviewedAt: r.updated_at ?? evalRow.updated_at,
        profile: rowToProfile(evalRow),
        teamId: r.team_id as TeamId,
        checkedControls: a.checkedControls,
        checkedEvidence: a.checkedEvidence,
        notes: a.notes,
        residualRisk: a.residualRisk,
        decision: a.decision,
      };
    });
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

export interface WorkspaceMember {
  userId: string;
  label: string;
  role: string;
}

/**
 * Everyone in the workspace, by name rather than by id.
 *
 * `auth.users` is not readable through RLS, which is why the members screen
 * used to render `a3f9c2b1…` for every person and why a review could not be
 * assigned to anybody. `profiles` (migration 0013) mirrors the identity fields
 * a colleague is allowed to see, and is visible only to people who share a
 * workspace with them.
 */
export async function listWorkspaceMembers(orgId: string): Promise<WorkspaceMember[]> {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from('memberships')
    .select('user_id, role')
    .eq('org_id', orgId);
  if (!members?.length) return [];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', members.map((m) => m.user_id));

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return members
    .map((m) => {
      const p = byId.get(m.user_id);
      return {
        userId: m.user_id,
        // Falls back to a short id rather than an empty row: a member whose
        // profile has not synced yet is still assignable.
        label: p?.full_name || p?.email || `${m.user_id.slice(0, 8)}…`,
        role: m.role,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export interface OpenReview {
  orgSlug: string;
  orgName: string;
  evaluationId: string;
  evaluationName: string;
  teamId: string;
  decision: string;
  dueDate: string;
}

/** Reviews assigned to the caller and not yet signed off, across all workspaces. */
export async function listMyOpenReviews(): Promise<OpenReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('my_open_reviews');
  if (error || !data) return [];
  type Row = Database['public']['Functions']['my_open_reviews']['Returns'][number];
  return (data as Row[]).map((r) => ({
    orgSlug: r.org_slug,
    orgName: r.org_name,
    evaluationId: r.evaluation_id,
    evaluationName: r.evaluation_name,
    teamId: r.team_id,
    decision: r.decision,
    dueDate: r.due_date,
  }));
}

export interface ExpiringEvaluation {
  id: string;
  name: string;
  platform: string;
  environment: string;
  validUntil: string;
  daysRemaining: number;
}

/**
 * Tools whose clearance has lapsed or is about to.
 *
 * The portfolio view is where a governance lead notices that six approvals
 * quietly went stale, so this is a first-class query rather than something
 * derived per row.
 */
export async function listExpiringEvaluations(
  orgId: string,
  withinDays = 30,
): Promise<ExpiringEvaluation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('expiring_evaluations', {
    p_org: orgId,
    p_within_days: withinDays,
  });
  if (error || !data) return [];
  type Row = Database['public']['Functions']['expiring_evaluations']['Returns'][number];
  return (data as Row[]).map((r) => ({
    id: r.id,
    name: r.name,
    platform: r.platform,
    environment: r.environment,
    validUntil: r.review_valid_until,
    daysRemaining: r.days_remaining,
  }));
}

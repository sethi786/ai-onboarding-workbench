'use server';

import { requireUser } from '@/lib/auth/require-user';
import { getOrgPlan } from '@/lib/auth/entitlements';
import { isAiConfigured, isAiFailure, type AiResult } from '@/lib/ai/client';
import {
  answerFromAssessment,
  draftExecutiveSummary,
  draftIntake,
  draftLensAnswer,
  type DraftedAnswer,
  type DraftedIntake,
  type DraftedLensAnswer,
} from '@/lib/ai/assist';
import { createClient } from '@/lib/supabase/server';
import { getEvaluation, loadAssessmentMap, rowToProfile } from '@/lib/db/queries';
import { computeScoreFromMap } from '@/workbench/engine/scoring';
import { TEAM_LENSES, LENS_BY_ID } from '@/workbench/data/teamLenses';
import { buildReportContext } from '@/workbench/export/reportContext';
import { makeEmptyAssessment } from '@/workbench/types';
import { resolveBranding } from '@/lib/branding';
import type { TeamId } from '@/workbench/types';

/**
 * Server actions for the AI assistant.
 *
 * Two things are enforced here and nowhere else. Membership: every action
 * resolves the workspace through an RLS-scoped read first, so an evaluation id
 * alone can't be used to pump another tenant's data through the model. And
 * length: the free-text inputs are user-supplied and go straight into a paid
 * API call, so they're bounded before they get there.
 */

export type ActionAiResult<T> = { data?: T; error?: string };

const MAX_DESCRIPTION_CHARS = 20_000;
const MAX_QUESTION_CHARS = 2_000;

function unwrap<T>(result: AiResult<T>): ActionAiResult<T> {
  if (isAiFailure(result)) return { error: result.error };
  return { data: result.data };
}

/** Lets the UI render an honest disabled state instead of failing on click. */
export async function aiAvailable(): Promise<boolean> {
  return isAiConfigured();
}

/**
 * Confirm the caller belongs to the org that owns this evaluation.
 *
 * `getEvaluation` is already RLS-scoped, so a row coming back means access —
 * but resolving the org explicitly keeps the plan lookup honest and gives a
 * single place to add per-plan AI limits later.
 */
async function requireEvaluationAccess(evalId: string) {
  await requireUser();
  const row = await getEvaluation(evalId);
  if (!row) return { error: 'Evaluation not found.' as const };
  const plan = await getOrgPlan(row.org_id);
  if (plan === null) return { error: 'Workspace not found.' as const };
  return { row, plan };
}

export async function aiDraftIntake(
  orgId: string,
  description: string,
): Promise<ActionAiResult<DraftedIntake>> {
  await requireUser();

  // Membership check: reading the org through RLS is what proves access.
  const plan = await getOrgPlan(orgId);
  if (plan === null) return { error: 'Workspace not found.' };

  const text = description.trim();
  if (text.length < 40) {
    return { error: 'Paste a bit more detail — a sentence or two isn’t enough to work from.' };
  }
  if (text.length > MAX_DESCRIPTION_CHARS) {
    return { error: 'That description is too long. Trim it to the parts describing the tool.' };
  }

  return unwrap(await draftIntake(text));
}

export async function aiDraftLens(
  evalId: string,
  teamId: TeamId,
): Promise<ActionAiResult<DraftedLensAnswer>> {
  const access = await requireEvaluationAccess(evalId);
  if ('error' in access) return { error: access.error };

  const lens = LENS_BY_ID[teamId];
  if (!lens) return { error: 'Unknown review lens.' };

  const map = await loadAssessmentMap(evalId);
  const profile = rowToProfile(access.row);
  const assessment = map[teamId] ?? makeEmptyAssessment(teamId);

  return unwrap(await draftLensAnswer(lens, profile, assessment));
}

export async function aiExecutiveSummary(evalId: string): Promise<ActionAiResult<string>> {
  const access = await requireEvaluationAccess(evalId);
  if ('error' in access) return { error: access.error };

  const ctx = await contextFor(evalId, access.row);
  return unwrap(await draftExecutiveSummary(ctx));
}

export async function aiAnswerQuestion(
  evalId: string,
  question: string,
): Promise<ActionAiResult<DraftedAnswer>> {
  const access = await requireEvaluationAccess(evalId);
  if ('error' in access) return { error: access.error };

  const q = question.trim();
  if (q.length < 8) return { error: 'Ask a fuller question.' };
  if (q.length > MAX_QUESTION_CHARS) return { error: 'That question is too long.' };

  const ctx = await contextFor(evalId, access.row);
  return unwrap(await answerFromAssessment(ctx, q));
}

async function contextFor(evalId: string, row: Awaited<ReturnType<typeof getEvaluation>>) {
  const supabase = await createClient();
  const [map, { data: org }] = await Promise.all([
    loadAssessmentMap(evalId),
    supabase.from('organizations').select('*').eq('id', row!.org_id).maybeSingle(),
  ]);
  const profile = rowToProfile(row!);
  const score = computeScoreFromMap(profile, TEAM_LENSES, map);
  return buildReportContext(
    profile,
    score,
    (teamId) => map[teamId] ?? makeEmptyAssessment(teamId),
    new Date().toISOString(),
    org ? resolveBranding(org) : undefined,
  );
}

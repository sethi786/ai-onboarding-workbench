import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { TEAM_LENSES } from '@/workbench/data/teamLenses';
import { computeScoreFromMap } from '@/workbench/engine/scoring';
import {
  makeEmptyAssessment,
  type TeamAssessment,
  type TeamId,
} from '@/workbench/types';
import { rowToProfile, rowToTeamAssessment } from './mappers';
import type {
  EvaluationRow,
  TeamAssessmentRow,
  EvidenceLinkRow,
} from './types';
import type { PortfolioItem } from '@/lib/portfolio';

// Read in pages to avoid Supabase's default row cap. Three tenant-scoped scans
// replace two additional round trips for every evaluation on the dashboard.
async function readAll<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await page(from, from + 499);
    if (error || !data)
      throw new Error(
        'Could not load your assessment portfolio. Please retry.',
      );
    all.push(...data);
    if (data.length < 500) return all;
  }
}

export const loadPortfolio = cache(
  async (orgId: string, orgSlug: string): Promise<PortfolioItem[]> => {
    const supabase = await createClient();
    const [evaluations, assessments, evidence] = await Promise.all([
      readAll<EvaluationRow>((from, to) =>
        supabase
          .from('evaluations')
          .select('*')
          .eq('org_id', orgId)
          .order('id')
          .range(from, to),
      ),
      readAll<TeamAssessmentRow>((from, to) =>
        supabase
          .from('team_assessments')
          .select('*')
          .eq('org_id', orgId)
          .order('id')
          .range(from, to),
      ),
      readAll<EvidenceLinkRow>((from, to) =>
        supabase
          .from('evidence_links')
          .select('*')
          .eq('org_id', orgId)
          .order('id')
          .range(from, to),
      ),
    ]);
    const answers = new Map(
      assessments.map((a) => [`${a.evaluation_id}:${a.team_id}`, a]),
    );
    const links = new Map<string, EvidenceLinkRow[]>();
    for (const e of evidence) {
      const key = `${e.evaluation_id}:${e.team_id}`;
      links.set(key, [...(links.get(key) ?? []), e]);
    }
    const today = new Date().toISOString().slice(0, 10);
    return evaluations
      .map((row) => {
        const map = {} as Record<TeamId, TeamAssessment>;
        for (const lens of TEAM_LENSES) {
          const key = `${row.id}:${lens.id}`;
          const answer = answers.get(key);
          map[lens.id] = answer
            ? rowToTeamAssessment(answer, links.get(key) ?? [])
            : makeEmptyAssessment(lens.id);
        }
        const score = computeScoreFromMap(rowToProfile(row), TEAM_LENSES, map);
        const required = TEAM_LENSES.filter(
          (lens) => score.perTeam[lens.id].required,
        );
        const overdue = required.filter(
          (lens) =>
            map[lens.id].dueDate &&
            map[lens.id].dueDate < today &&
            !score.perTeam[lens.id].readyForReview,
        ).length;
        const next =
          required.find((lens) => score.perTeam[lens.id].hasCriticalBlocker) ??
          required.find((lens) => score.perTeam[lens.id].gateReasons.length);
        return {
          id: row.id,
          name: row.name,
          platform: row.platform,
          category: row.tool_category,
          environment: row.environment,
          owner: row.business_owner,
          updatedAt: row.updated_at,
          readiness: score.readiness,
          risk: score.risk,
          recommendation: score.recommendation,
          blockers: score.blockersCount,
          evidence: score.evidenceCompleteness,
          overdue,
          nextAction: next
            ? `${next.title}: ${score.perTeam[next.id].gateReasons[0]}`
            : 'Prepare the evidence pack for your formal review.',
          nextHref: `/portal/${orgSlug}/evaluations/${row.id}/${next ? `lenses#${next.id}` : 'exports'}`,
        };
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
);

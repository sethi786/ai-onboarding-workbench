import { beforeEach, describe, expect, it, vi } from 'vitest';
import { filterPortfolio, type PortfolioItem } from '../portfolio';
const database = vi.hoisted(() => ({
  rows: {} as Record<string, Record<string, unknown>[]>,
  fail: '',
  calls: [] as { table: string; org?: string; from?: number }[],
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from(table: string) {
      const call: (typeof database.calls)[number] = { table };
      database.calls.push(call);
      const chain = {
        select() {
          return chain;
        },
        order() {
          return chain;
        },
        eq(_field: string, org: string) {
          call.org = org;
          return chain;
        },
        range(from: number, to: number) {
          call.from = from;
          return Promise.resolve({
            data: (database.rows[table] ?? [])
              .filter((row) => row.org_id === call.org)
              .slice(from, to + 1),
            error: database.fail === table ? new Error('Unavailable') : null,
          });
        },
      };
      return chain;
    },
  }),
}));
import { loadPortfolio } from '../db/portfolio';
import { baseProfile, allFull } from '@/workbench/engine/__tests__/fixtures';
import { profilePatchToRow, assessmentPatchToRow } from '../db/mappers';
import { computeScoreFromMap } from '@/workbench/engine/scoring';
import { TEAM_LENSES } from '@/workbench/data/teamLenses';

const item: PortfolioItem = {
  id: 'one',
  name: 'Assistant',
  platform: 'Example',
  category: 'AI',
  environment: 'Pilot',
  owner: 'Alex',
  updatedAt: '2026-01-01',
  readiness: 60,
  risk: 'High',
  recommendation: 'Needs Remediation',
  blockers: 1,
  overdue: 0,
  evidence: 30,
  nextAction: 'Review controls',
  nextHref: '/test',
};
beforeEach(() => {
  database.calls = [];
  database.fail = '';
  database.rows = {};
});
describe('portfolio review logic', () => {
  it('combines case-insensitive terms and ranks blockers before overdue work', () => {
    const items = [
      item,
      { ...item, id: 'two', blockers: 0, overdue: 2 },
      { ...item, id: 'three', owner: '', blockers: 3 },
    ];
    expect(
      filterPortfolio(items, 'ALEX pilot', 'all', 'priority').map((x) => x.id),
    ).toEqual(['one', 'two']);
    expect(
      filterPortfolio(items, '', 'all', 'priority').map((x) => x.id),
    ).toEqual(['three', 'one', 'two']);
    expect(items.map((x) => x.id)).toEqual(['one', 'two', 'three']);
  });
  it('reproduces the shared scoring engine rather than inventing portfolio scores', async () => {
    const profile = baseProfile();
    const map = allFull();
    const expected = computeScoreFromMap(profile, TEAM_LENSES, map);
    database.rows.evaluations = [
      {
        ...profilePatchToRow(profile),
        id: 'eval',
        org_id: 'tenant',
        scope_revision: 1,
        updated_at: '2026-01-01',
        created_at: '2026-01-01',
      },
    ];
    database.rows.team_assessments = Object.entries(map).map(
      ([team, assessment]) => ({
        ...assessmentPatchToRow(assessment),
        id: team,
        org_id: 'tenant',
        evaluation_id: 'eval',
        team_id: team,
        scope_revision: assessment.scopeRevision,
      }),
    );
    database.rows.evidence_links = Object.entries(map).flatMap(
      ([team, assessment]) =>
        assessment.evidenceLinks.map((link) => ({
          id: link.id,
          org_id: 'tenant',
          evaluation_id: 'eval',
          team_id: team,
          label: link.label,
          url: link.url,
          evidence_id: link.evidenceId,
          scope_revision: link.scopeRevision,
          expires_on: link.expiresOn,
        })),
    );
    const actual = await loadPortfolio('tenant', 'workspace');
    expect(actual[0]).toMatchObject({
      readiness: expected.readiness,
      recommendation: expected.recommendation,
      evidence: expected.evidenceCompleteness,
      blockers: expected.blockersCount,
    });
    expect(database.calls).toHaveLength(3);
    expect(database.calls.every((call) => call.org === 'tenant')).toBe(true);
  });
  it('does not truncate portfolios at the provider row limit or mix tenants', async () => {
    database.rows.evaluations = [
      ...Array.from({ length: 501 }, (_, n) => ({
        ...profilePatchToRow(baseProfile()),
        id: `eval-${n}`,
        org_id: 'tenant',
        updated_at: '2026-01-01',
      })),
      {
        ...profilePatchToRow(baseProfile()),
        id: 'private',
        org_id: 'other-tenant',
        updated_at: '2026-01-01',
      },
    ];
    const result = await loadPortfolio('tenant', 'workspace');
    expect(result).toHaveLength(501);
    expect(result.some((row) => row.id === 'private')).toBe(false);
    expect(
      database.calls
        .filter((call) => call.table === 'evaluations')
        .map((call) => call.from),
    ).toEqual([0, 500]);
  });
  it('shows an error instead of treating an unavailable evidence store as missing evidence', async () => {
    database.fail = 'evidence_links';
    await expect(loadPortfolio('tenant', 'workspace')).rejects.toThrow(
      'Could not load',
    );
  });
});

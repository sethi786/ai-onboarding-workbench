import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  calls: [] as { table: string; filters: [string, unknown][]; mutation?: unknown }[],
  results: {} as Record<string, { data: unknown; error: unknown }>,
}));
vi.mock('@/lib/auth/require-user', () => ({ requireUser: async () => ({ id: 'me' }) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('Not found'); } }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from(table: string) {
  const call: typeof mock.calls[number] = { table, filters: [] }; mock.calls.push(call);
  const chain = {
    select() { return chain; }, order() { return chain; },
    eq(k: string, v: unknown) { call.filters.push([k, v]); return chain; },
    upsert(v: unknown) { call.mutation = v; return chain; },
    insert(v: unknown) { call.mutation = v; return chain; },
    delete() { call.mutation = 'delete'; return chain; },
    maybeSingle: async () => mock.results[table],
    then(resolve: (result: unknown) => unknown) { return Promise.resolve(mock.results[table]).then(resolve); },
  };
  return chain;
} }) }));

import { authorizeEvaluation } from '../auth/evaluation-access';
import { requireMembership } from '../auth/membership';
import { removeEvidenceLink, updateAssessment, addEvidenceLink } from '../actions/assessments';

beforeEach(() => {
  mock.calls = [];
  mock.results = {
    evaluations: { data: { id: 'eval', org_id: 'org', scope_revision: 1 }, error: null },
    organizations: { data: { id: 'org', slug: 'workspace' }, error: null },
    memberships: { data: { role: 'member', organizations: { id: 'org', slug: 'workspace' } }, error: null },
    evidence_links: { data: [{ id: 'link' }], error: null },
    team_assessments: { data: [{ id: 'assessment' }], error: null },
  };
});

describe('server action authorization and failure handling', () => {
  it('resolves the caller’s membership, not another member’s role', async () => {
    expect((await requireMembership('workspace')).role).toBe('member');
    expect(mock.calls[0].filters).toContainEqual(['user_id', 'me']);
  });
  it('binds the parent, workspace slug, and caller before mutations', async () => {
    expect(await authorizeEvaluation('eval', 'workspace', 'org')).not.toHaveProperty('error');
    expect(mock.calls.find((c) => c.table === 'memberships')?.filters).toEqual([['org_id', 'org'], ['user_id', 'me']]);
    expect(mock.calls.find((c) => c.table === 'organizations')?.filters).toContainEqual(['slug', 'workspace']);
  });
  it('rejects a mismatched parent org before a write', async () => {
    expect(await updateAssessment('eval', 'other-org', 'workspace', 'security-sar', { score: 5 })).toHaveProperty('error');
    expect(mock.calls.some((c) => c.mutation)).toBe(false);
  });
  it('rejects viewers and membership query failures', async () => {
    mock.results.memberships.data = { role: 'viewer' };
    expect(await updateAssessment('eval', 'org', 'workspace', 'security-sar', { score: 5 })).toHaveProperty('error');
    mock.results.memberships = { data: null, error: new Error('offline') };
    expect(await authorizeEvaluation('eval', 'workspace')).toHaveProperty('error');
    expect(mock.calls.some((c) => c.mutation)).toBe(false);
  });
  it('cannot delete evidence by ID without also binding its parent', async () => {
    expect(await removeEvidenceLink('link', 'eval', 'workspace')).toEqual({});
    const deletion = mock.calls.find((c) => c.mutation === 'delete')!;
    expect(deletion.filters).toEqual([['id', 'link'], ['evaluation_id', 'eval'], ['org_id', 'org']]);
  });
  it('reports RLS no-ops instead of successful saves', async () => {
    mock.results.evidence_links.data = [];
    expect(await removeEvidenceLink('missing-link', 'eval', 'workspace')).toHaveProperty('error');
    mock.results.team_assessments.data = [];
    expect(await updateAssessment('eval', 'org', 'workspace', 'security-sar', { score: 5 })).toHaveProperty('error');
  });
  it('rejects ownership injection and unsafe evidence before writes', async () => {
    expect(await updateAssessment('eval', 'org', 'workspace', 'security-sar', { scopeRevision: 99 })).toHaveProperty('error');
    expect(await addEvidenceLink('eval', 'org', 'workspace', 'security-sar', 'unsafe', 'javascript:alert(1)', 'sar-e1', '', 1)).toHaveProperty('error');
    expect(mock.calls.some((c) => c.mutation)).toBe(false);
  });
  it('rejects attaching evidence from an outdated page scope', async () => {
    mock.results.evaluations.data = { id: 'eval', org_id: 'org', scope_revision: 2 };
    expect(await addEvidenceLink('eval', 'org', 'workspace', 'security-sar', 'SAR', 'https://example.com', 'sar-e1', '', 1)).toHaveProperty('error');
    expect(mock.calls.some((c) => c.mutation)).toBe(false);
  });
  it('stamps evidence using the server’s scope and preserves its requirement', async () => {
    expect(await addEvidenceLink('eval', 'org', 'workspace', 'security-sar', 'SAR', 'https://example.com', 'sar-e1', '2027-01-01', 1)).toEqual({});
    expect(mock.calls.find((c) => c.table === 'evidence_links')?.mutation).toMatchObject({ org_id: 'org', evaluation_id: 'eval', evidence_id: 'sar-e1', scope_revision: 1, expires_on: '2027-01-01' });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  user: {
    id: '00000000-0000-4000-8000-000000000001',
    email_confirmed_at: '2026-10-17',
  },
  queries: [] as string[],
  failed: '',
  unavailable: '',
  role: 'owner',
  countFilters: [] as [string, unknown][],
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/require-user', () => ({
  requireUser: async () => state.user,
}));
vi.mock('@/lib/auth/membership', () => ({
  requireMembership: async () => ({
    org: { id: 'current-org', slug: 'example', name: 'Example', plan: 'free' },
    role: state.role,
  }),
}));
vi.mock('@/lib/auth/entitlements', () => ({
  getEvaluationQuota: async () => ({ used: 1, limit: 3 }),
  getMemberQuota: async () => ({ used: 1, limit: 1 }),
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('Not found');
  },
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from(table: string) {
      state.queries.push(table);
      const chain = {
        select: () => chain,
        limit: () => chain,
        eq(key: string, value: unknown) {
          state.countFilters.push([key, value]);
          return chain;
        },
        is: () => chain,
        gt: () => Promise.resolve({ error: null, count: 0 }),
        abortSignal: async () => {
          if (state.unavailable === table)
            throw new Error('Secret network detail');
          return {
            error:
              state.failed === table ? { message: 'Secret DB detail' } : null,
          };
        },
      };
      return chain;
    },
  }),
}));
import { isOperator, requireOperator } from '@/lib/auth/operator';
import { deploymentDiagnostics } from '@/lib/admin/diagnostics';
import WorkspaceAdmin from '@/app/portal/[orgSlug]/admin/page';
import { portalNav } from '@/components/portal/nav';
beforeEach(() => {
  vi.stubEnv('AEGIS_ADMIN_USER_IDS', state.user.id);
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://db.example.test');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'not-a-real-key');
  state.user.email_confirmed_at = '2026-10-17';
  state.queries = [];
  state.failed = '';
  state.unavailable = '';
  state.role = 'owner';
  state.countFilters = [];
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        external: { email: true },
        disable_signup: false,
        mailer_autoconfirm: false,
      }),
    }),
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe('operator authorization and bounded diagnostics', () => {
  it('disables operator access when no IDs are provisioned', async () => {
    vi.stubEnv('AEGIS_ADMIN_USER_IDS', '');
    expect(isOperator(state.user)).toBe(false);
    await expect(deploymentDiagnostics()).rejects.toThrow('Not found');
    expect(state.queries).toHaveLength(0);
  });
  it('requires the exact UUID and a verified email, not an editable metadata role', async () => {
    vi.stubEnv('AEGIS_ADMIN_USER_IDS', `prefix-${state.user.id}`);
    await expect(requireOperator()).rejects.toThrow('Not found');
    vi.stubEnv('AEGIS_ADMIN_USER_IDS', state.user.id);
    state.user.email_confirmed_at = '';
    await expect(requireOperator()).rejects.toThrow('Not found');
  });
  it('queries real schemas and reports connection failures instead of treating configured keys as success', async () => {
    state.failed = 'workspace_activity';
    state.unavailable = 'evaluations';
    const checks = await deploymentDiagnostics();
    expect(state.queries).toContain('workspace_activity');
    expect(checks.find((c) => c.name === 'workspace_activity')?.status).toBe(
      'fail',
    );
    expect(checks.find((c) => c.name === 'evaluations')?.status).toBe('fail');
    expect(checks.find((c) => c.name === 'memberships')?.status).toBe('pass');
    expect(checks.find((c) => c.name === 'Supabase environment')?.status).toBe(
      'pending',
    );
    expect(JSON.stringify(checks)).not.toMatch(/Secret|not-a-real-key/);
  });
  it('requires confirmed email signup at the provider', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        external: { email: true },
        mailer_autoconfirm: true,
      }),
    } as Response);
    expect((await deploymentDiagnostics())[0].status).toBe('fail');
  });
  it('records an auth outage as a failed check without leaking details', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Secret'));
    const check = (await deploymentDiagnostics())[0];
    expect(check.status).toBe('fail');
    expect(check.detail).not.toContain('Secret');
  });
});
describe('workspace administration', () => {
  it('blocks members and viewers on the server even when they enter the URL directly', async () => {
    for (const role of ['member', 'viewer']) {
      state.role = role;
      await expect(
        WorkspaceAdmin({ params: Promise.resolve({ orgSlug: 'example' }) }),
      ).rejects.toThrow('Not found');
      expect(
        portalNav('example', role as 'member' | 'viewer').some(
          (item) => item.label === 'Administration',
        ),
      ).toBe(false);
    }
    expect(state.queries).toHaveLength(0);
  });
  it('scopes admin invitation counts to the authorized organization', async () => {
    await WorkspaceAdmin({ params: Promise.resolve({ orgSlug: 'example' }) });
    expect(state.countFilters).toEqual([['org_id', 'current-org']]);
    expect(
      portalNav('example', 'owner').some(
        (item) => item.label === 'Administration',
      ),
    ).toBe(true);
  });
});

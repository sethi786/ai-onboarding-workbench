import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  role: 'owner',
  userId: 'caller',
  memberId: 'target-user',
  result: { data: [{ id: 'member' }], error: null } as {
    data: unknown;
    error: unknown;
  },
  calls: [] as {
    table: string;
    mutation?: unknown;
    filters: [string, unknown][];
  }[],
}));
vi.mock('@/lib/auth/membership', () => ({
  requireMembership: async () => ({ org: { id: 'tenant' }, role: state.role }),
}));
vi.mock('@/lib/auth/require-user', () => ({
  requireUser: async () => ({ id: state.userId }),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from(table: string) {
      const call: (typeof state.calls)[number] = { table, filters: [] };
      state.calls.push(call);
      const chain = {
        select() {
          return chain;
        },
        eq(field: string, value: unknown) {
          call.filters.push([field, value]);
          return chain;
        },
        update(value: unknown) {
          call.mutation = value;
          return chain;
        },
        delete() {
          call.mutation = 'delete';
          return chain;
        },
        maybeSingle: async () => ({
          data: state.memberId ? { user_id: state.memberId } : null,
          error: null,
        }),
        then(resolve: (result: unknown) => unknown) {
          return Promise.resolve(state.result).then(resolve);
        },
      };
      return chain;
    },
  }),
}));
import { renameWorkspace, changeWorkspaceMember } from '../actions/workspace';
const membership = '00000000-0000-4000-8000-000000000001';
beforeEach(() => {
  state.role = 'owner';
  state.userId = 'caller';
  state.memberId = 'target-user';
  state.calls = [];
  state.result = { data: [{ id: 'member' }], error: null };
});
describe('workspace mutation permissions', () => {
  it('does not let an admin change member roles even when they can invite members', async () => {
    state.role = 'admin';
    expect(
      await changeWorkspaceMember('workspace', membership, 'owner'),
    ).toHaveProperty('error');
    expect(state.calls).toHaveLength(0);
  });
  it('binds access changes to the current workspace and exact membership', async () => {
    expect(
      await changeWorkspaceMember('workspace', membership, 'viewer'),
    ).toEqual({});
    for (const call of state.calls)
      expect(call.filters).toEqual([
        ['id', membership],
        ['org_id', 'tenant'],
      ]);
    expect(state.calls[1].mutation).toEqual({ role: 'viewer' });
  });
  it('rejects unknown or cross-workspace memberships without a write', async () => {
    state.memberId = '';
    expect(
      await changeWorkspaceMember('workspace', membership, 'remove'),
    ).toHaveProperty('error');
    expect(state.calls.some((call) => call.mutation)).toBe(false);
  });
  it('protects the caller from removing their own workspace access through this action', async () => {
    state.memberId = state.userId;
    expect(
      await changeWorkspaceMember('workspace', membership, 'remove'),
    ).toHaveProperty('error');
    expect(state.calls.some((call) => call.mutation)).toBe(false);
  });
  it('reports a permission change between authorization and the mutation', async () => {
    state.result = { data: [], error: null };
    expect(
      await changeWorkspaceMember('workspace', membership, 'remove'),
    ).toHaveProperty('error');
    expect(await renameWorkspace('workspace', 'Updated name')).toHaveProperty(
      'error',
    );
  });
  it('allows a manager to rename only the display name', async () => {
    state.role = 'admin';
    expect(await renameWorkspace('workspace', '  New name  ')).toEqual({});
    expect(state.calls[0]).toEqual({
      table: 'organizations',
      mutation: { name: 'New name' },
      filters: [['id', 'tenant']],
    });
  });
  it('rejects member renaming and malformed names', async () => {
    state.role = 'member';
    expect(await renameWorkspace('workspace', 'Name')).toHaveProperty('error');
    state.role = 'owner';
    for (const name of ['', '  ', 'x'.repeat(121), 'line\nbreak'])
      expect(await renameWorkspace('workspace', name)).toHaveProperty('error');
    expect(state.calls).toHaveLength(0);
  });
});

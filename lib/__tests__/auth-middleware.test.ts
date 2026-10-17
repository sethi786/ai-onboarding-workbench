import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mock = vi.hoisted(() => ({
  user: { id: 'signed-in' } as { id: string } | null,
}));
vi.mock('@supabase/ssr', () => ({
  createServerClient: (
    _url: unknown,
    _key: unknown,
    options: { cookies: { setAll: (cookies: unknown[]) => void } },
  ) => ({
    auth: {
      getUser: async () => {
        options.cookies.setAll([
          { name: 'test-refresh', value: 'new', options: { path: '/' } },
        ]);
        return { data: { user: mock.user } };
      },
    },
  }),
}));
import { updateSession } from '@/lib/supabase/middleware';
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://db.example.test');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-only');
  mock.user = { id: 'signed-in' };
});
afterEach(() => vi.unstubAllEnvs());
it('allows authenticated users to reach password recovery instead of redirecting away', async () => {
  const result = await updateSession(
    new NextRequest('https://example.test/reset-password'),
  );
  expect(result.headers.get('location')).toBeNull();
});
it('preserves the selected tool and refreshed session when leaving signup', async () => {
  const result = await updateSession(
    new NextRequest(
      'https://example.test/signup?next=%2Fportal%2Fstart%3Ftemplate%3Dlovable',
    ),
  );
  expect(result.headers.get('location')).toBe(
    'https://example.test/portal/start?template=lovable',
  );
  expect(result.cookies.get('test-refresh')?.value).toBe('new');
});
it('preserves query parameters on a protected route for an anonymous visitor', async () => {
  mock.user = null;
  const result = await updateSession(
    new NextRequest('https://example.test/portal/start?template=lovable'),
  );
  expect(
    new URL(result.headers.get('location')!).searchParams.get('next'),
  ).toBe('/portal/start?template=lovable');
});
it('rejects an external post-login destination', async () => {
  const result = await updateSession(
    new NextRequest('https://example.test/login?next=https://attacker.test'),
  );
  expect(result.headers.get('location')).toBe('https://example.test/portal');
});

import { safeNext } from '@/lib/auth/safe-redirect';
it('rejects control-character and backslash redirect normalization tricks', () => {
  for (const target of [
    '/\n/evil.test',
    '/\t/evil.test',
    '/\\evil.test',
    '//evil.test',
    'https://evil.test',
  ])
    expect(safeNext(target)).toBe('/portal');
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const auth = vi.hoisted(() => ({
  exchange: vi.fn(),
  verify: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      exchangeCodeForSession: auth.exchange,
      verifyOtp: auth.verify,
      signOut: auth.signOut,
    },
  }),
}));
import { GET as callback } from '@/app/auth/callback/route';
import { POST as verify } from '@/app/auth/verify/route';
import { POST as signOut } from '@/app/auth/signout/route';
import { emailRedirect } from '@/lib/auth/email-flow';
const token = 'a'.repeat(64);
const origin = 'https://aegis.example.test';
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://db.example.test');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-public-key');
  auth.exchange.mockReset().mockResolvedValue({ error: null });
  auth.verify.mockReset().mockResolvedValue({ error: null });
  auth.signOut.mockReset().mockResolvedValue({ error: null });
});
afterEach(() => vi.unstubAllEnvs());
function form(values: Record<string, string> = {}, source = origin) {
  return new Request(`${origin}/auth/verify`, {
    method: 'POST',
    headers: {
      origin: source,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      token_hash: token,
      type: 'email',
      next: '/portal/start?template=lovable',
      ...values,
    }),
  });
}
describe('email confirmation and recovery boundaries', () => {
  it('keeps catalogue intent through the redirect and a token-hash template without consuming the token on GET', async () => {
    const link = new URL(
      emailRedirect(origin, '/portal/start?template=lovable'),
    );
    link.searchParams.set('token_hash', token);
    link.searchParams.set('type', 'email');
    const response = await callback(new Request(link));
    const destination = new URL(response.headers.get('location')!);
    expect(destination.pathname).toBe('/auth/confirm');
    expect(destination.searchParams.get('next')).toBe(
      '/portal/start?template=lovable',
    );
    expect(auth.exchange).not.toHaveBeenCalled();
    expect(auth.verify).not.toHaveBeenCalled();
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
  });
  it('verifies on explicit same-origin POST without needing the original browser PKCE code', async () => {
    const response = await verify(form());
    expect(auth.verify).toHaveBeenCalledWith({
      token_hash: token,
      type: 'email',
    });
    expect(auth.exchange).not.toHaveBeenCalled();
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      `${origin}/portal/start?template=lovable`,
    );
  });
  it('always sends recovery links to the password form even if their destination was changed', async () => {
    const response = await verify(
      form({ type: 'recovery', next: 'https://attacker.test' }),
    );
    expect(response.headers.get('location')).toBe(`${origin}/reset-password`);
  });
  it('prevents an open redirect after email confirmation', async () => {
    expect(
      (await verify(form({ next: '//attacker.test' }))).headers.get('location'),
    ).toBe(`${origin}/portal`);
  });
  it('rejects cross-origin token submission before calling the provider', async () => {
    expect((await verify(form({}, 'https://attacker.test'))).status).toBe(403);
    expect(auth.verify).not.toHaveBeenCalled();
  });
  it('rejects unsupported token types and oversized tokens before calling the provider', async () => {
    const invalid: Record<string, string>[] = [
      { type: 'email_change' },
      { type: 'sms' },
      { token_hash: '' },
      { token_hash: 'x'.repeat(5000) },
    ];
    for (const values of invalid) {
      expect((await verify(form(values))).headers.get('location')).toContain(
        '/auth/error',
      );
    }
    expect(auth.verify).not.toHaveBeenCalled();
  });
  it('makes an expired or replayed recovery link recoverable without leaking its token', async () => {
    auth.verify.mockResolvedValue({
      error: { message: 'expired secret detail' },
    });
    const response = await verify(form({ type: 'recovery' }));
    expect(response.headers.get('location')).toBe(
      `${origin}/auth/error?next=%2Freset-password`,
    );
    expect([...response.headers.values()].join()).not.toContain(token);
  });
  it('turns a provider outage into a retry page', async () => {
    auth.verify.mockRejectedValue(new Error('network'));
    expect((await verify(form())).headers.get('location')).toContain(
      '/auth/error',
    );
    auth.exchange.mockRejectedValue(new Error('network'));
    expect(
      (
        await callback(
          new Request(
            `${origin}/auth/callback?code=example&next=/reset-password`,
          ),
        )
      ).headers.get('location'),
    ).toBe(`${origin}/auth/error?next=%2Freset-password`);
  });
  it('preserves the existing PKCE confirmation flow', async () => {
    const response = await callback(
      new Request(
        `${origin}/auth/callback?code=example&next=/portal/start%3Ftemplate%3Dlovable`,
      ),
    );
    expect(auth.exchange).toHaveBeenCalledWith('example');
    expect(response.headers.get('location')).toBe(
      `${origin}/portal/start?template=lovable`,
    );
  });
  it('handles missing configuration without a callback crash', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
    expect(
      (
        await callback(new Request(`${origin}/auth/callback?code=example`))
      ).headers.get('location'),
    ).toBe(`${origin}/launch-status`);
    expect((await verify(form())).headers.get('location')).toBe(
      `${origin}/launch-status`,
    );
    expect(auth.exchange).not.toHaveBeenCalled();
    expect(auth.verify).not.toHaveBeenCalled();
  });
  it('rejects cross-site signout and signs out only the current browser on a valid request', async () => {
    expect(
      (
        await signOut(
          new Request(`${origin}/auth/signout`, {
            method: 'POST',
            headers: { origin: 'https://attacker.test' },
          }),
        )
      ).status,
    ).toBe(403);
    expect(auth.signOut).not.toHaveBeenCalled();
    expect(
      (
        await signOut(
          new Request(`${origin}/auth/signout`, {
            method: 'POST',
            headers: { origin },
          }),
        )
      ).status,
    ).toBe(303);
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });
});

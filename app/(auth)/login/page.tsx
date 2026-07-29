'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { safeNext } from '@/lib/auth/safe-redirect';
import { AuthInput, AuthLabel, AuthError, AuthSubmit } from '@/components/auth/auth-ui';

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    params.get('error') ? 'Authentication failed. Please try again.' : null,
  );
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  /**
   * Hand off to the employer's identity provider for this email's domain.
   *
   * Supabase resolves the domain to a registered SAML provider. When none is
   * registered it errors, and the usual cause is somebody trying SSO before
   * their administrator has set it up — worth saying plainly rather than
   * surfacing a raw provider error.
   */
  async function onSso() {
    const domain = email.includes('@') ? email.slice(email.lastIndexOf('@') + 1).trim() : '';
    if (!domain) {
      setError('Enter your work email first, then continue with SSO.');
      return;
    }
    setSsoLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithSSO({ domain });
    if (error || !data?.url) {
      setError(
        error && /no sso provider|not found/i.test(error.message)
          ? `Single sign-on isn’t set up for ${domain}. Ask your administrator, or sign in with a password.`
          : (error?.message ?? 'Could not start single sign-on.'),
      );
      setSsoLoading(false);
      return;
    }
    window.location.assign(data.url);
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-foreground">Log in to Aegis</h1>
      <p className="mt-1 text-sm text-muted-foreground">Welcome back.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <AuthError message={error} />
        <div>
          <AuthLabel htmlFor="email">Work email</AuthLabel>
          <AuthInput id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <AuthLabel htmlFor="password">Password</AuthLabel>
            <Link href="/forgot-password" className="mb-1.5 text-xs text-electric hover:underline">
              Forgot?
            </Link>
          </div>
          <AuthInput id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <AuthSubmit disabled={loading}>{loading ? 'Signing in…' : 'Log in'}</AuthSubmit>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={onSso}
        disabled={ssoLoading}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
      >
        <Building2 className="h-4 w-4 text-muted-foreground" />
        {ssoLoading ? 'Redirecting…' : 'Continue with SSO'}
      </button>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Uses your organization&rsquo;s identity provider.
      </p>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        No account?{' '}
        <Link href="/signup" className="text-electric hover:underline">
          Start free
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}

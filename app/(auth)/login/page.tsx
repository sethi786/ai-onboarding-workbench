'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { safeNext } from '@/lib/auth/safe-redirect';
import { authErrorMessage, needsEmailConfirmation } from '@/lib/auth/errors';
import { navigateAfterSignIn } from '@/lib/auth/navigation';
import {
  AuthInput,
  AuthLabel,
  AuthError,
  AuthSubmit,
  AuthPasswordInput,
} from '@/components/auth/auth-ui';

function LoginInner() {
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    params.get('error') === 'unavailable'
      ? 'The account service could not be reached. Please retry shortly.'
      : params.get('error')
        ? 'Authentication failed. Please try again.'
        : null,
  );
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setConfirmEmail(false);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setError(
          authErrorMessage(
            error,
            'We could not sign you in. Check your details and try again.',
          ),
        );
        setConfirmEmail(needsEmailConfirmation(error));
        return;
      }
      if (!data.session) {
        setError(
          'We could not start your session. Please try signing in again.',
        );
        return;
      }
      navigateAfterSignIn(next);
    } catch {
      setError('We could not sign in. Please retry.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Welcome back.</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Sign in to your Aegis workspace to continue your AI reviews.
      </p>
      <form onSubmit={onSubmit} aria-busy={loading} className="mt-8 space-y-5">
        <AuthError message={error} />
        {confirmEmail && (
          <Link
            href={`/resend-confirmation?next=${encodeURIComponent(next)}`}
            className="block text-sm underline"
          >
            Need to confirm your email?
          </Link>
        )}
        <div>
          <AuthLabel htmlFor="email">Work email</AuthLabel>
          <AuthInput
            id="email"
            type="email"
            autoComplete="email"
            disabled={loading}
            autoCapitalize="none"
            spellCheck={false}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <AuthLabel htmlFor="password">Password</AuthLabel>
            <Link
              href="/forgot-password"
              className="mb-2 inline-flex min-h-11 items-center text-sm text-electric hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <AuthPasswordInput
            id="password"
            autoComplete="current-password"
            disabled={loading}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <AuthSubmit disabled={loading}>
          {loading ? 'Signing in…' : 'Log in'}
        </AuthSubmit>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        No account?{' '}
        <Link
          href={`/signup?next=${encodeURIComponent(next)}`}
          className="text-electric hover:underline"
        >
          Start free
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p role="status">Loading sign-in…</p>}>
      <LoginInner />
    </Suspense>
  );
}

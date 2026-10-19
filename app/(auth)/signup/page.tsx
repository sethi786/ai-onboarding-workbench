'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { safeNext } from '@/lib/auth/safe-redirect';
import { emailRedirect } from '@/lib/auth/email-flow';
import { useSearchParams } from 'next/navigation';
import { navigateAfterSignIn } from '@/lib/auth/navigation';
import { authErrorMessage } from '@/lib/auth/errors';
import { createClient } from '@/lib/supabase/client';
import {
  AuthInput,
  AuthLabel,
  AuthError,
  AuthSubmit,
  AuthPasswordInput,
} from '@/components/auth/auth-ui';

function SignupInner() {
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: emailRedirect(window.location.origin, next),
        },
      });
      if (error) {
        setError(
          authErrorMessage(
            error,
            'We could not create your account. Please try again shortly.',
          ),
        );
        setLoading(false);
        return;
      }
      // If email confirmation is enabled, there is no active session yet.
      if (data.session) {
        navigateAfterSignIn(next);
      } else {
        setNeedsConfirm(true);
        setLoading(false);
      }
    } catch {
      setError('We could not create your account. Please retry.');
    } finally {
      setLoading(false);
    }
  }

  if (needsConfirm) {
    return (
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          Check your email
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If registration is available for this address, a confirmation link is
          on its way to <span className="text-foreground">{email}</span>. Click
          it to activate your account. Check your spam folder too.
        </p>
        <Link
          href={`/resend-confirmation?next=${encodeURIComponent(next)}`}
          className="mt-6 block text-center text-sm font-medium text-electric underline"
        >
          Resend confirmation email
        </Link>
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="mt-6 block text-center text-sm text-electric hover:underline"
        >
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">
        Create your account
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Start with three free tool assessments.
      </p>
      <form onSubmit={onSubmit} aria-busy={loading} className="mt-8 space-y-5">
        <AuthError message={error} />
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
          <AuthLabel htmlFor="password">Password</AuthLabel>
          <AuthPasswordInput
            id="password"
            autoComplete="new-password"
            disabled={loading}
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            At least 8 characters.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          By creating an account, you agree to the{' '}
          <Link className="underline" href="/terms">
            terms
          </Link>{' '}
          and acknowledge the{' '}
          <Link className="underline" href="/privacy">
            privacy notice
          </Link>
          .
        </p>
        <AuthSubmit disabled={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </AuthSubmit>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="text-electric hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<p role="status">Loading account setup…</p>}>
      <SignupInner />
    </Suspense>
  );
}

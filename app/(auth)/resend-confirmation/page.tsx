'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { emailRedirect } from '@/lib/auth/email-flow';
import { safeNext } from '@/lib/auth/safe-redirect';
import {
  AuthInput,
  AuthLabel,
  AuthError,
  AuthSubmit,
} from '@/components/auth/auth-ui';

function ResendForm() {
  const next = safeNext(useSearchParams().get('next'));
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || cooldown) return;
    setBusy(true);
    setError(null);
    setSent(false);
    try {
      const { error } = await createClient().auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: emailRedirect(window.location.origin, next),
        },
      });
      if (error)
        setError('Could not send a link. Please wait a minute and try again.');
      else {
        setSent(true);
        setCooldown(60);
      }
    } catch {
      setError('We could not reach the account service. Please retry.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Confirm your account
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Request another confirmation email. Check your spam folder if it doesn’t
        arrive.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <AuthError message={error} />
        {sent && (
          <p role="status" className="rounded-lg bg-electric/10 p-3 text-sm">
            If this address has an unconfirmed account, a new link is on its
            way.
          </p>
        )}
        <div>
          <AuthLabel htmlFor="email">Work email</AuthLabel>
          <AuthInput
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <AuthSubmit disabled={busy || cooldown > 0}>
          {busy
            ? 'Requesting…'
            : cooldown
              ? `Try again in ${cooldown}s`
              : 'Send confirmation link'}
        </AuthSubmit>
      </form>
      <Link
        href={`/login?next=${encodeURIComponent(next)}`}
        className="mt-6 block text-center text-sm underline"
      >
        Back to sign in
      </Link>
    </div>
  );
}
export default function ResendConfirmationPage() {
  return (
    <Suspense>
      <ResendForm />
    </Suspense>
  );
}

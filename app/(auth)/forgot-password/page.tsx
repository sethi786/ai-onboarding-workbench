'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AuthInput, AuthLabel, AuthError, AuthSubmit } from '@/components/auth/auth-ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div>
        <h1 className="text-lg font-semibold text-foreground">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account exists for {email}, a password reset link is on its way.
        </p>
        <Link href="/login" className="mt-6 block text-center text-sm text-electric hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-foreground">Reset your password</h1>
      <p className="mt-1 text-sm text-muted-foreground">We’ll email you a reset link.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <AuthError message={error} />
        <div>
          <AuthLabel htmlFor="email">Work email</AuthLabel>
          <AuthInput id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <AuthSubmit disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</AuthSubmit>
      </form>
      <Link href="/login" className="mt-5 block text-center text-sm text-muted-foreground hover:text-foreground">
        Back to log in
      </Link>
    </div>
  );
}

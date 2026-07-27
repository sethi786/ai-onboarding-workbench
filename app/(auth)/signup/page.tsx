'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AuthInput, AuthLabel, AuthError, AuthSubmit } from '@/components/auth/auth-ui';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/portal`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // If email confirmation is enabled, there is no active session yet.
    if (data.session) {
      router.push('/portal');
      router.refresh();
    } else {
      setNeedsConfirm(true);
      setLoading(false);
    }
  }

  if (needsConfirm) {
    return (
      <div>
        <h1 className="text-lg font-semibold text-white">Check your email</h1>
        <p className="mt-2 text-sm text-slate-400">
          We sent a confirmation link to <span className="text-white">{email}</span>. Click it to
          activate your account, then log in.
        </p>
        <Link href="/login" className="mt-6 block text-center text-sm text-electric hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-white">Create your account</h1>
      <p className="mt-1 text-sm text-slate-400">Start clearing AI tools for the enterprise.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <AuthError message={error} />
        <div>
          <AuthLabel htmlFor="email">Work email</AuthLabel>
          <AuthInput id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <AuthLabel htmlFor="password">Password</AuthLabel>
          <AuthInput id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
        </div>
        <AuthSubmit disabled={loading}>{loading ? 'Creating…' : 'Create account'}</AuthSubmit>
      </form>
      <p className="mt-5 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="text-electric hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

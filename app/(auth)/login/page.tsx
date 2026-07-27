'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
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

  return (
    <div>
      <h1 className="text-lg font-semibold text-white">Log in to Aegis</h1>
      <p className="mt-1 text-sm text-slate-400">Welcome back.</p>
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
      <p className="mt-5 text-center text-sm text-slate-400">
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

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AuthInput, AuthLabel, AuthError, AuthSubmit } from '@/components/auth/auth-ui';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push('/portal');
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-foreground">Set a new password</h1>
      <p className="mt-1 text-sm text-muted-foreground">Choose a strong password to finish.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <AuthError message={error} />
        <div>
          <AuthLabel htmlFor="password">New password</AuthLabel>
          <AuthInput id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <AuthSubmit disabled={loading}>{loading ? 'Saving…' : 'Update password'}</AuthSubmit>
      </form>
    </div>
  );
}

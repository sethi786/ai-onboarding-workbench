'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { authErrorMessage } from '@/lib/auth/errors';
import {
  AuthPasswordInput,
  AuthLabel,
  AuthError,
  AuthSubmit,
} from '@/components/auth/auth-ui';

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (password !== confirmation) {
      setError(
        'The passwords don’t match. Please enter the same password twice.',
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(
          authErrorMessage(
            error,
            'We could not update your password. Please try again shortly.',
          ),
        );
        setLoading(false);
        return;
      }
      setPassword('');
      setConfirmation('');
      setSaved(true);
    } catch {
      setError('We could not update your password. Please retry.');
    } finally {
      setLoading(false);
    }
  }

  if (saved)
    return (
      <div>
        <h1 className="text-2xl font-semibold">Password updated</h1>
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          Use your new password the next time you sign in.
        </p>
        <button
          className="mt-6 min-h-12 w-full rounded-lg bg-electric px-4 text-sm font-medium text-white"
          onClick={() => {
            router.push('/portal');
            router.refresh();
          }}
        >
          Open your workspace
        </button>
      </div>
    );

  return (
    <div>
      <h1 className="text-lg font-semibold text-foreground">
        Set a new password
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose a strong password to finish.
      </p>
      <form onSubmit={onSubmit} aria-busy={loading} className="mt-6 space-y-4">
        <AuthError message={error} />
        <div>
          <AuthLabel htmlFor="password">New password</AuthLabel>
          <AuthPasswordInput
            id="password"
            autoComplete="new-password"
            disabled={loading}
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <AuthLabel htmlFor="confirm-password">Confirm new password</AuthLabel>
          <AuthPasswordInput
            id="confirm-password"
            disabled={loading}
            autoComplete="new-password"
            minLength={8}
            required
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </div>
        <AuthSubmit disabled={loading}>
          {loading ? 'Saving…' : 'Update password'}
        </AuthSubmit>
      </form>
    </div>
  );
}

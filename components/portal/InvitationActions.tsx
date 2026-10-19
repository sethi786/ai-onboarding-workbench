'use client';
import { useState, useTransition } from 'react';
import {
  acceptInvitation,
  revokeInvitation,
} from '@/lib/actions/organizations';
import { Button } from '@/components/ui/button';
export function InvitationAction({
  token,
  id,
}: {
  token?: string;
  id?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  return (
    <div>
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError('');
            // Redirects from the acceptance action must propagate through Next's transition.
            const result = token
              ? await acceptInvitation(token)
              : await revokeInvitation(id!);
            if (result.error) setError(result.error);
          })
        }
      >
        {pending ? 'Working…' : token ? 'Accept invitation' : 'Revoke'}
      </Button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

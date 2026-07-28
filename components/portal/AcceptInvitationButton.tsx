'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { acceptInvitation } from '@/lib/actions/invitations';
import { Button } from '@/components/ui/button';

export function AcceptInvitationButton({
  token,
  orgName,
}: {
  token: string;
  orgName: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <Button
        variant="primary"
        className="w-full"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            // On success the action redirects, so control never returns here.
            const res = await acceptInvitation(token);
            if (res?.error) {
              setError(res.error);
              toast.error(res.error);
            }
          })
        }
      >
        {pending ? 'Joining…' : `Join ${orgName}`}
      </Button>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}

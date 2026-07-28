'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { inviteMember } from '@/lib/actions/organizations';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';

export function InviteMemberForm({ orgId }: { orgId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          setError(null);
          setInviteUrl(null);
          const res = await inviteMember(orgId, fd);
          if (res?.error) {
            toast.error(res.error);
            setError(res.error);
          } else {
            toast.success('Invitation created — copy the link to send it');
            setInviteUrl(res.inviteUrl ?? null);
          }
        })
      }
      className="flex flex-wrap items-end gap-2"
    >
      <div className="flex-1">
        <Input name="email" type="email" placeholder="teammate@company.com" required />
      </div>
      <Select name="role" defaultValue="member" className="w-32">
        <option value="admin">Admin</option>
        <option value="member">Member</option>
        <option value="viewer">Viewer</option>
      </Select>
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? 'Inviting…' : 'Invite'}
      </Button>
      {error && <p className="w-full text-xs text-danger">{error}</p>}
      {inviteUrl && (
        <div className="w-full rounded-md border border-border bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">
            Send this link to your teammate. It only works for the email address you invited.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-background px-2 py-1.5 font-mono text-[11px]">
              {inviteUrl}
            </code>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(inviteUrl);
                toast.success('Invite link copied');
              }}
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}

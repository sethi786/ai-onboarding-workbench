'use client';

import { useState, useTransition } from 'react';
import { inviteMember } from '@/lib/actions/organizations';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';

export function InviteMemberForm({ orgId }: { orgId: string }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          setMsg(null);
          const res = await inviteMember(orgId, fd);
          setMsg(res?.error ? res.error : 'Invitation created.');
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
      {msg && <p className="w-full text-xs text-muted-foreground">{msg}</p>}
    </form>
  );
}

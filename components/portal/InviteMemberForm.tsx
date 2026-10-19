'use client';
import { useState, useTransition } from 'react';
import { inviteMember } from '@/lib/actions/organizations';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';
import { unstable_rethrow } from 'next/navigation';
export function InviteMemberForm({
  orgId,
  canInviteAdmin = false,
}: {
  orgId: string;
  canInviteAdmin?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [recipient, setRecipient] = useState('');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(async () => {
          setError('');
          setLink('');
          try {
            const result = await inviteMember(orgId, fd);
            if (result.error) setError(result.error);
            else if (result.token) {
              setRecipient(String(fd.get('email') ?? '').trim());
              setLink(`${window.location.origin}/invite/${result.token}`);
            }
          } catch (error) {
            unstable_rethrow(error);
            setError('Could not create the invitation. Please retry.');
          }
        });
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="min-w-0 basis-56 flex-1">
        <Label htmlFor="invite-email">Teammate email</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={pending}
          required
          maxLength={254}
          placeholder="teammate@company.com"
        />
      </div>
      <div>
        <Label htmlFor="invite-role">Role</Label>
        <Select
          id="invite-role"
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          disabled={pending}
        >
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
          {canInviteAdmin && <option value="admin">Admin</option>}
        </Select>
      </div>
      <Button disabled={pending} type="submit">
        {pending ? 'Creating…' : 'Create invitation link'}
      </Button>
      {error && (
        <p role="alert" className="w-full text-sm text-danger">
          {error}
        </p>
      )}
      {link && (
        <div role="status" className="w-full rounded-lg bg-muted p-4">
          <p className="mb-2 text-sm">
            Share this link with {recipient}. It expires in 7 days and requires
            their verified email. No email has been sent.
          </p>
          <Input
            aria-label="Invitation link"
            readOnly
            value={link}
            onFocus={(e) => e.target.select()}
          />
        </div>
      )}
    </form>
  );
}

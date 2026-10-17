'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { changeWorkspaceMember } from '@/lib/actions/workspace';
import type { OrgRole } from '@/lib/db/types';
import { useGovernanceSave } from './useGovernanceSave';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';

export function MemberAccess({
  orgSlug,
  id,
  email,
  currentRole,
}: {
  orgSlug: string;
  id: string;
  email: string;
  currentRole: OrgRole;
}) {
  const [role, setRole] = useState<OrgRole>(currentRole);
  const [confirm, setConfirm] = useState<OrgRole | 'remove' | null>(null);
  const { save, pending, error } = useGovernanceSave();
  const router = useRouter();
  return (
    <div className="w-full space-y-3 sm:w-auto sm:max-w-md">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label={`Role for ${email}`}
          value={role}
          disabled={pending}
          onChange={(e) => {
            setRole(e.target.value as OrgRole);
            setConfirm(null);
          }}
          className="w-auto"
        >
          <option value="viewer">Viewer</option>
          <option value="member">Member</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </Select>
        <Button
          disabled={pending || role === currentRole}
          onClick={() => setConfirm(role)}
        >
          Change role
        </Button>
        <button
          disabled={pending}
          className="min-h-11 rounded-md px-3 text-sm text-danger disabled:opacity-50"
          onClick={() => setConfirm('remove')}
        >
          Remove
        </button>
      </div>
      {confirm && (
        <div
          className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm"
          role="group"
          aria-label="Confirm access change"
        >
          <p className="break-words">
            {confirm === 'remove'
              ? `Remove ${email} from this workspace? Their existing work will be retained.`
              : `Give ${email} the ${confirm} role?`}
            {confirm === 'owner' &&
              ' Owners control billing and can change every member’s access.'}
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              disabled={pending}
              onClick={() =>
                save(
                  () => changeWorkspaceMember(orgSlug, id, confirm),
                  () => {
                    setConfirm(null);
                    router.refresh();
                  },
                )
              }
            >
              {pending ? 'Updating…' : 'Confirm change'}
            </Button>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setConfirm(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

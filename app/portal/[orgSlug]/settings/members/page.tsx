import { requireMembership } from '@/lib/auth/membership';
import { createClient } from '@/lib/supabase/server';
import { canManageOrg } from '@/lib/rbac';
import { Badge } from '@/components/ui/badge';
import { InvitationAction } from '@/components/portal/InvitationActions';
import { InviteMemberForm } from '@/components/portal/InviteMemberForm';
import { MemberAccess } from '@/components/portal/MemberAccess';
import { requireUser } from '@/lib/auth/require-user';
import type { WorkspaceMember, MembershipRow } from '@/lib/db/types';

export default async function MembersPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org, role } = await requireMembership(orgSlug);
  const user = await requireUser();
  const manage = canManageOrg(role);
  const supabase = await createClient();
  const [
    { data: members, error: memberError },
    { data: invites, error: inviteError },
  ] = await Promise.all([
    manage
      ? supabase.rpc('list_workspace_members', { p_org: org.id })
      : supabase
          .from('memberships')
          .select('id, user_id, role, created_at')
          .eq('org_id', org.id),
    supabase
      .from('invitations')
      .select('id, email, role, accepted_at, expires_at, revoked_at')
      .eq('org_id', org.id),
  ]);
  if (memberError || inviteError)
    throw new Error('Could not load workspace members. Please retry.');
  const pendingInvites = (invites ?? []).filter(
    (i) =>
      !i.accepted_at && !i.revoked_at && new Date(i.expires_at) > new Date(),
  );

  return (
    <div className="space-y-6">
      {manage && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-semibold">Invite a member</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Create a link to share with your teammate. Their verified email must
            match. Invitations reserve a seat for 7 days.
          </p>
          <InviteMemberForm orgId={org.id} canInviteAdmin={role === 'owner'} />
        </div>
      )}

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">Members · {members?.length ?? 0}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Viewers read and export. Members edit assessments. Admins manage
            evaluations and invitations. Owners also manage billing and access.
          </p>
        </div>
        <div className="divide-y divide-border">
          {((members as (MembershipRow | WorkspaceMember)[]) ?? []).map((m) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center gap-3 px-4 py-4 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="break-words font-medium">
                  {manage
                    ? (m as WorkspaceMember).email
                    : m.user_id === user.id
                      ? user.email
                      : `Member ${m.user_id.slice(0, 8)}`}
                  {m.user_id === user.id && ' (you)'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Joined{' '}
                  {new Date(m.created_at).toLocaleDateString('en-CA', {
                    timeZone: 'UTC',
                  })}
                </p>
              </div>
              <Badge tone="electric">{m.role}</Badge>
              {role === 'owner' && m.user_id !== user.id && (
                <MemberAccess
                  key={`${m.id}-${m.role}`}
                  orgSlug={orgSlug}
                  id={m.id}
                  email={(m as WorkspaceMember).email}
                  currentRole={m.role}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {pendingInvites.length > 0 && (
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold">Pending invitations</h2>
          </div>
          <div className="divide-y divide-border">
            {pendingInvites.map((i) => (
              <div
                key={i.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="break-words">{i.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires{' '}
                    {new Date(i.expires_at).toLocaleDateString('en-CA', {
                      timeZone: 'UTC',
                    })}
                  </p>
                </div>
                <Badge tone="neutral" className="ml-auto">
                  {i.role}
                </Badge>
                {manage && <InvitationAction id={i.id} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';

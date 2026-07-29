import { requireMembership } from '@/lib/auth/membership';
import { createClient } from '@/lib/supabase/server';
import { canManageOrg } from '@/lib/rbac';
import { Badge } from '@/components/ui/badge';
import { InviteMemberForm } from '@/components/portal/InviteMemberForm';
import { UpgradeNotice } from '@/components/portal/UpgradeGate';
import { memberQuota, getPlan } from '@/lib/plans';
import { listWorkspaceMembers } from '@/lib/db/queries';

export default async function MembersPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org, role } = await requireMembership(orgSlug);
  const supabase = await createClient();
  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase.from('memberships').select('id, user_id, role, created_at').eq('org_id', org.id),
    supabase.from('invitations').select('id, email, role, accepted_at').eq('org_id', org.id),
  ]);
  const manage = canManageOrg(role);
  // Rendered from `profiles`, because auth.users is not readable through RLS —
  // this list used to show a truncated UUID for every person.
  const people = await listWorkspaceMembers(org.id);

  // Seats in use = accepted members + invitations still outstanding, which is
  // what the server-side guard counts when someone tries to invite.
  const pending = (invites ?? []).filter((i) => !i.accepted_at);
  const quota = memberQuota(org.plan, (members ?? []).length + pending.length);
  const plan = getPlan(org.plan);

  return (
    <div className="space-y-6">
      {manage &&
        (quota.allowed ? (
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">Invite a member</h2>
              {quota.limit !== null && (
                <span className="text-xs text-muted-foreground">
                  {quota.used} of {quota.limit} seats used on {plan.name}
                </span>
              )}
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              They’ll be added when they accept the invitation and sign in.
            </p>
            <InviteMemberForm orgId={org.id} />
          </div>
        ) : (
          <UpgradeNotice orgSlug={orgSlug}>
            The {plan.name} plan includes {quota.limit}{' '}
            {quota.limit === 1 ? 'seat' : 'seats'} and {quota.used}{' '}
            {quota.used === 1 ? 'is' : 'are'} taken, counting pending invitations. Upgrade to invite
            your reviewers.
          </UpgradeNotice>
        ))}

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">Members</h2>
        </div>
        <div className="divide-y divide-border">
          {people.map((m) => (
            <div key={m.userId} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="font-medium">{m.label}</span>
              <Badge tone="electric" className="ml-auto">{m.role}</Badge>
            </div>
          ))}
        </div>
      </div>

      {pending.length > 0 && (
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold">Pending invitations</h2>
          </div>
          <div className="divide-y divide-border">
            {pending.map((i) => (
              <div key={i.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                {i.email}
                <Badge tone="neutral" className="ml-auto">{i.role}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';

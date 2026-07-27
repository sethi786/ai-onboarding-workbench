import { requireMembership } from '@/lib/auth/membership';
import { createClient } from '@/lib/supabase/server';
import { canManageOrg } from '@/lib/rbac';
import { Badge } from '@/components/ui/badge';
import { InviteMemberForm } from '@/components/portal/InviteMemberForm';

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

  return (
    <div className="space-y-6">
      {manage && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-semibold">Invite a member</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            They’ll be added when they accept and sign in.
          </p>
          <InviteMemberForm orgId={org.id} />
        </div>
      )}

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">Members</h2>
        </div>
        <div className="divide-y divide-border">
          {(members ?? []).map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="font-mono text-xs text-muted-foreground">{m.user_id.slice(0, 8)}…</span>
              <Badge tone="electric" className="ml-auto">{m.role}</Badge>
            </div>
          ))}
        </div>
      </div>

      {(invites ?? []).filter((i) => !i.accepted_at).length > 0 && (
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold">Pending invitations</h2>
          </div>
          <div className="divide-y divide-border">
            {(invites ?? [])
              .filter((i) => !i.accepted_at)
              .map((i) => (
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

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireMembership } from '@/lib/auth/membership';
import { canManageOrg } from '@/lib/rbac';
import { createClient } from '@/lib/supabase/server';
import { getEvaluationQuota, getMemberQuota } from '@/lib/auth/entitlements';
import { getPlan } from '@/lib/plans';
import {
  Users,
  CreditCard,
  Settings,
  History,
  ArrowUpRight,
} from 'lucide-react';

export default async function WorkspaceAdmin({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org, role } = await requireMembership(orgSlug);
  if (!canManageOrg(role)) notFound();
  const client = await createClient();
  const [evaluations, members, invites] = await Promise.all([
    getEvaluationQuota(org.id, org.plan),
    getMemberQuota(org.id, org.plan),
    client
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org.id)
      .is('accepted_at', null)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString()),
  ]);
  if (invites.error)
    throw new Error('Workspace administration could not be loaded.');
  const base = `/portal/${orgSlug}`;
  const areas = [
    {
      title: 'Members & invitations',
      detail:
        role === 'owner'
          ? 'Invite teammates, manage roles and revoke access.'
          : 'Invite members and viewers; review pending invitations.',
      href: `${base}/settings/members`,
      icon: Users,
    },
    {
      title: 'Workspace settings',
      detail: 'Update the workspace name and review its identity.',
      href: `${base}/settings/organization`,
      icon: Settings,
    },
    {
      title: 'Plan & billing',
      detail:
        role === 'owner'
          ? 'Manage your subscription and review plan usage.'
          : 'Review plan limits. The owner manages payments.',
      href: `${base}/settings/billing`,
      icon: CreditCard,
    },
    {
      title: 'Activity history',
      detail: 'Review changes to assessments, evidence and access.',
      href: `${base}/activity`,
      icon: History,
    },
  ];
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-widest text-electric">
          Workspace administration
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Manage {org.name}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Keep access, ownership and your subscription in order.
        </p>
      </header>
      <section
        className="grid gap-4 sm:grid-cols-3"
        aria-label="Workspace usage"
      >
        {[
          {
            label: 'Current plan',
            value: getPlan(org.plan).name,
            note:
              role === 'owner'
                ? 'You manage this subscription'
                : 'Managed by a workspace owner',
          },
          {
            label: 'Members',
            value: `${members.used}${members.limit === null ? '' : ` / ${members.limit}`}`,
            note: `${invites.count ?? 0} pending invitations reserve additional seats`,
          },
          {
            label: 'Assessments',
            value: `${evaluations.used}${evaluations.limit === null ? '' : ` / ${evaluations.limit}`}`,
            note:
              evaluations.limit === null
                ? 'Unlimited on your current plan'
                : 'Stored assessments count toward your limit',
          },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold">{item.value}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {item.note}
            </p>
          </div>
        ))}
      </section>
      <section
        className="grid gap-4 md:grid-cols-2"
        aria-label="Administration tools"
      >
        {areas.map((area) => (
          <Link
            key={area.href}
            href={area.href}
            className="group rounded-xl border bg-card p-6 transition-colors hover:border-electric/50"
          >
            <div className="flex justify-between">
              <area.icon className="h-5 w-5 text-electric" />
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <h2 className="mt-5 font-semibold">{area.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {area.detail}
            </p>
          </Link>
        ))}
      </section>
      <section className="rounded-xl border bg-muted/50 p-5">
        <h2 className="text-sm font-semibold">
          Access follows your workspace role
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Owners manage billing and member roles. Admins manage workspace
          settings and invitations. Members edit assessments; viewers can read
          and export. Changes remain subject to database permissions.
        </p>
      </section>
    </div>
  );
}

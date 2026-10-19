import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  ShieldCheck,
  ClipboardList,
  Users,
  FileCheck2,
} from 'lucide-react';
import { requireMembership } from '@/lib/auth/membership';
import { loadPortfolio } from '@/lib/db/portfolio';
import { filterPortfolio } from '@/lib/portfolio';
import { canEdit } from '@/lib/rbac';
import { evaluationQuota } from '@/lib/plans';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org, role } = await requireMembership(orgSlug);
  const items = await loadPortfolio(org.id, orgSlug);
  const ready = items.filter(
    (item) => item.recommendation === 'Proceed',
  ).length;
  const blocked = items.filter((item) => item.blockers > 0).length;
  const overdue = items.reduce((sum, item) => sum + item.overdue, 0);
  const average = items.length
    ? Math.round(
        items.reduce((sum, item) => sum + item.readiness, 0) / items.length,
      )
    : 0;
  const attention = filterPortfolio(
    items.filter((item) => item.recommendation !== 'Proceed'),
    '',
    'all',
    'priority',
  ).slice(0, 5);
  const base = `/portal/${orgSlug}`;
  const create =
    canEdit(role) && evaluationQuota(org.plan, items.length).allowed;
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 break-words text-xs font-semibold uppercase tracking-widest text-electric">
            {org.name}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Your governance overview
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            See what needs attention. Keep each AI decision moving.
          </p>
        </div>
        {create && (
          <Link
            href={`${base}/evaluations/new`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-paper"
          >
            <Plus className="h-4 w-4" />
            New evaluation
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: 'In your portfolio',
            value: items.length,
            hint: 'Stored evaluations',
          },
          {
            label: 'Ready for review',
            value: ready,
            hint: 'Evidence and controls prepared',
          },
          {
            label: 'Has blockers',
            value: blocked,
            hint: 'Evaluations needing resolution',
          },
          {
            label: 'Overdue reviews',
            value: overdue,
            hint: 'Required lenses past their due date',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-4 sm:p-5"
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="my-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.hint}</p>
          </div>
        ))}
      </div>
      {!items.length ? (
        <section className="rounded-2xl border border-electric/20 bg-sage p-6 sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-widest text-electric">
            Start here
          </p>
          <h2 className="mt-3 text-2xl font-semibold">
            Build a record for your first AI decision.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Pick a tool, describe how your team will use it, then work through
            the review questions. Your answers stay unreviewed until you add
            controls and evidence.
          </p>
          <div className="mt-7 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: ClipboardList,
                title: '1. Choose a starting point',
                text: 'Use a tool template or describe your own system.',
                href: `${base}/library`,
                link: 'Explore the library',
              },
              {
                icon: ShieldCheck,
                title: '2. Review your use case',
                text: 'Confirm data, permissions, ownership, and the relevant controls.',
                href: `${base}/evaluations/new`,
                link: 'Create an evaluation',
              },
              {
                icon: Users,
                title: '3. Bring your reviewers',
                text: 'Invite collaborators when your workspace plan supports more seats.',
                href: `${base}/settings/members`,
                link: 'View workspace members',
              },
            ].map((step) => (
              <div key={step.title}>
                <step.icon className="h-5 w-5 text-electric" />
                <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.text}
                </p>
                <Link
                  className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-electric"
                  href={step.href}
                >
                  {step.link}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
              <div>
                <h2 className="font-semibold">Your next actions</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Blockers first, then overdue and incomplete reviews.
                </p>
              </div>
              <Link
                href={`${base}/evaluations`}
                className="text-sm text-electric"
              >
                View all
              </Link>
            </div>
            {attention.length ? (
              <ul className="divide-y divide-border">
                {attention.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.nextHref}
                      className="flex gap-4 p-5 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-sm font-semibold">
                            {item.name}
                          </h3>
                          {item.blockers > 0 && (
                            <Badge tone="danger">
                              {item.blockers} blockers
                            </Badge>
                          )}
                          {item.overdue > 0 && (
                            <Badge tone="warning">{item.overdue} overdue</Badge>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {item.nextAction}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {item.owner || 'Owner not assigned'}
                        </p>
                      </div>
                      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-electric" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8">
                <FileCheck2 className="h-7 w-7 text-electric" />
                <h3 className="mt-3 font-semibold">
                  Ready for the next conversation
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your evaluations have the evidence and controls needed for
                  formal review. Your organization still owns the approval
                  decision.
                </p>
              </div>
            )}
          </section>
          <div className="space-y-5">
            <section className="rounded-xl bg-ink p-6 text-paper">
              <p className="text-xs font-medium text-white/60">
                Portfolio readiness
              </p>
              <div className="my-5 flex items-baseline gap-2">
                <span className="text-5xl font-semibold tracking-tight">
                  {average}
                </span>
                <span className="text-white/50">/100 average</span>
              </div>
              <Progress value={average} />
              <p className="mt-5 text-sm leading-relaxed text-white/65">
                An internal readiness measure based on your team’s answers and
                evidence. Each evaluation shows the remaining gaps.
              </p>
              <Link
                href="/assessment"
                className="mt-4 inline-flex items-center gap-2 text-sm text-white"
              >
                Understand the review lenses
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </section>
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold">Keep the record clear</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Review recent changes to evidence, decisions, and workspace
                access.
              </p>
              <Link
                href={`${base}/activity`}
                className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-electric"
              >
                Open activity history
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          </div>
        </div>
      )}
      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
        Aegis supports self-assessment and preparation. Readiness scores and
        recorded decisions do not replace your organization’s formal security,
        privacy, legal, and risk approvals.
      </p>
    </div>
  );
}
export const dynamic = 'force-dynamic';

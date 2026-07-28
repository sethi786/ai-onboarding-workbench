import Link from 'next/link';
import { Plus, ClipboardList } from 'lucide-react';
import { requireMembership } from '@/lib/auth/membership';
import { listEvaluations } from '@/lib/db/queries';
import { scoreEvaluation } from '@/lib/db/score';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { riskTone, readinessTone, recommendationTone } from '@/components/portal/status';
import { evaluationQuota, getPlan } from '@/lib/plans';
import { UpgradeNotice } from '@/components/portal/UpgradeGate';

export default async function EvaluationsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org } = await requireMembership(orgSlug);
  const rows = await listEvaluations(org.id);
  const scored = await Promise.all(rows.map(async (r) => ({ r, s: await scoreEvaluation(r) })));

  // Quota is derived from the rows we already loaded — no extra round trip.
  const quota = evaluationQuota(org.plan, rows.length);
  const plan = getPlan(org.plan);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Evaluations</h1>
          <p className="text-sm text-muted-foreground">
            Tools your organization is reviewing for adoption.
            {quota.limit !== null && (
              <span className="ml-1.5 text-muted-foreground/80">
                {quota.used} of {quota.limit} on {plan.name}.
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/portal/${orgSlug}/library`}
            className="inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
          >
            From template
          </Link>
          {quota.allowed ? (
            <Link
              href={`/portal/${orgSlug}/evaluations/new`}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-electric px-4 text-sm font-medium text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> New evaluation
            </Link>
          ) : (
            <span
              aria-disabled
              title="You've reached your plan's evaluation limit"
              className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-md bg-muted px-4 text-sm font-medium text-muted-foreground"
            >
              <Plus className="h-4 w-4" /> New evaluation
            </span>
          )}
        </div>
      </div>

      {!quota.allowed && (
        <div className="mb-6">
          <UpgradeNotice orgSlug={orgSlug}>
            You’ve used all {quota.limit} evaluations on the {plan.name} plan. Upgrade for unlimited
            evaluations, or delete one to free a slot.
          </UpgradeNotice>
        </div>
      )}

      {scored.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-semibold">No evaluations yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Start from the prefilled tool library or create a blank evaluation.
          </p>
          <Link
            href={`/portal/${orgSlug}/library`}
            className="mt-5 inline-flex h-9 items-center rounded-md bg-electric px-4 text-sm font-medium text-white hover:opacity-90"
          >
            Browse tool library
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {scored.map(({ r, s }) => (
            <Link
              key={r.id}
              href={`/portal/${orgSlug}/evaluations/${r.id}`}
              className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-electric/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{r.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {r.platform || '—'} · {r.environment}
                  </p>
                </div>
                <Badge tone={recommendationTone(s.recommendation)}>{s.recommendation}</Badge>
              </div>
              <div className="mt-4">
                <Progress value={s.readiness} showLabel />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Badge tone={riskTone(s.risk)}>{s.risk} risk</Badge>
                <Badge tone={readinessTone(s.readiness)}>{s.readiness}/100</Badge>
                {s.blockersCount > 0 && <Badge tone="danger">{s.blockersCount} blockers</Badge>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';

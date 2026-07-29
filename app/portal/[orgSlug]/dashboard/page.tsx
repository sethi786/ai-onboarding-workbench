import Link from 'next/link';
import { requireMembership } from '@/lib/auth/membership';
import { listEvaluations, listMyOpenReviews } from '@/lib/db/queries';
import { scoreEvaluation } from '@/lib/db/score';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { riskTone, recommendationTone } from '@/components/portal/status';
import { LENS_BY_ID } from '@/workbench/data/teamLenses';
import type { TeamId } from '@/workbench/types';
import { ScoreGauge } from '@/components/ui/ScoreGauge';
import { DISCLAIMER } from '@/lib/site';

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-[26px] font-semibold leading-none tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org } = await requireMembership(orgSlug);
  const [rows, mine] = await Promise.all([listEvaluations(org.id), listMyOpenReviews()]);
  const scored = await Promise.all(rows.map(async (r) => ({ r, s: await scoreEvaluation(r) })));

  const total = scored.length;
  const ready = scored.filter((x) => x.s.recommendation === 'Proceed').length;
  const blocked = scored.filter((x) => x.s.hasCriticalBlocker).length;
  // Average only what's been reviewed. Counting untouched evaluations as zero
  // would make the portfolio look worse the more tools you queue up, which
  // punishes the one behaviour this product is trying to encourage.
  const started = scored.filter((x) => x.s.coverage > 0);
  const notStarted = total - started.length;
  const avg = started.length
    ? Math.round(started.reduce((a, x) => a + x.s.readiness, 0) / started.length)
    : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display-md">Governance Control Tower</h1>
          <p className="text-sm text-muted-foreground">{org.name} · tool adoption portfolio</p>
        </div>
        <Link
          href={`/portal/${orgSlug}/evaluations/new`}
          className="inline-flex h-9 items-center rounded-md bg-electric px-4 text-sm font-medium text-white hover:opacity-90"
        >
          New evaluation
        </Link>
      </div>

      {/* The first question a reviewer has on signing in is "what needs me?".
          Until reviews could be assigned to a person rather than to a string,
          there was no way to answer it and fifteen review teams coordinated in
          email — the work this product exists to replace. */}
      {mine.length > 0 && (
        <div className="rounded-lg border border-electric/30 bg-electric/[0.04]">
          <div className="flex flex-wrap items-baseline gap-x-3 border-b border-electric/20 p-4">
            <h2 className="font-semibold">Assigned to you</h2>
            <span className="text-sm text-muted-foreground">
              {mine.length} review{mine.length === 1 ? '' : 's'} waiting
            </span>
          </div>
          <div className="divide-y divide-border">
            {mine.map((m) => (
              <Link
                key={`${m.evaluationId}-${m.teamId}`}
                href={`/portal/${m.orgSlug}/evaluations/${m.evaluationId}/lenses`}
                className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm hover:bg-card/60"
              >
                <span className="font-medium">{LENS_BY_ID[m.teamId as TeamId]?.title ?? m.teamId}</span>
                <span className="text-muted-foreground">{m.evaluationName}</span>
                {m.orgSlug !== orgSlug && <Badge tone="outline">{m.orgName}</Badge>}
                <span className="flex-1" />
                {m.dueDate && (
                  <span className="text-xs text-muted-foreground">due {m.dueDate}</span>
                )}
                <Badge tone={recommendationTone(m.decision as never)}>{m.decision}</Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* One panel, not five. The gauge and the four counters answer the same
          question and belong in the same frame; boxing each of them separately
          made the first screen after sign-in read as a widget gallery. */}
      <div className="flex flex-col items-center gap-8 rounded-lg border border-border bg-card p-6 sm:flex-row sm:gap-12">
        <ScoreGauge value={avg} size={132} label="Avg readiness" />
        <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
          <Stat label="Tools in flight" value={total} />
          <Stat label="Cleared" value={ready} />
          <Stat label="Blocked" value={blocked} />
          <Stat label="Not started" value={notStarted} />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">Evaluations</h2>
        </div>
        {scored.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No evaluations yet.{' '}
            <Link href={`/portal/${orgSlug}/library`} className="text-electric hover:underline">
              Start from the tool library →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {scored.map(({ r, s }) => (
              <Link
                key={r.id}
                href={`/portal/${orgSlug}/evaluations/${r.id}`}
                className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted/40 sm:gap-4"
              >
                <div className="w-full min-w-0 sm:w-56 sm:shrink-0">
                  <div className="truncate text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.platform || '—'} · {r.environment}</div>
                </div>
                <div className="min-w-[120px] flex-1">
                  <Progress value={s.readiness} showLabel />
                  {/* A readiness figure is only as meaningful as the share of
                      reviews behind it — say so rather than let 100% of one
                      lens read as 100% of the review. */}
                  {s.coverage < 1 && (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {s.requiredTeams - s.teamsNotStarted} of {s.requiredTeams} reviews started
                    </div>
                  )}
                </div>
                <Badge tone={riskTone(s.risk)}>{s.risk}</Badge>
                <Badge tone={recommendationTone(s.recommendation)}>{s.recommendation}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      <p className="rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-[oklch(0.45_0.09_75)]">
        {DISCLAIMER}
      </p>
    </div>
  );
}

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { requireMembership } from '@/lib/auth/membership';
import { listEvaluations } from '@/lib/db/queries';
import { scoreEvaluation } from '@/lib/db/score';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { riskTone, recommendationTone } from '@/components/portal/status';
import { DISCLAIMER } from '@/lib/site';

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
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
  const rows = await listEvaluations(org.id);
  const scored = await Promise.all(rows.map(async (r) => ({ r, s: await scoreEvaluation(r) })));

  const total = scored.length;
  const ready = scored.filter((x) => x.s.recommendation === 'Proceed').length;
  const blocked = scored.filter((x) => x.s.hasCriticalBlocker).length;
  const avg = total ? Math.round(scored.reduce((a, x) => a + x.s.readiness, 0) / total) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Governance Control Tower</h1>
          <p className="text-sm text-muted-foreground">{org.name} · AI onboarding portfolio</p>
        </div>
        <Link
          href={`/portal/${orgSlug}/evaluations/new`}
          className="inline-flex h-9 items-center rounded-md bg-electric px-4 text-sm font-medium text-white hover:opacity-90"
        >
          New evaluation
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="AI tools in flight" value={total} />
        <Stat label="Cleared to proceed" value={ready} />
        <Stat label="Blocked" value={blocked} />
        <Stat label="Avg readiness" value={`${avg}/100`} />
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
                className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40"
              >
                <div className="w-56 shrink-0">
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.platform || '—'} · {r.environment}</div>
                </div>
                <div className="flex-1"><Progress value={s.readiness} showLabel /></div>
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

import { notFound } from 'next/navigation';
import { getEvaluation, loadAssessmentMap, rowToProfile } from '@/lib/db/queries';
import { computeScoreFromMap } from '@/workbench/engine/scoring';
import { TEAM_LENSES, LENS_BY_ID } from '@/workbench/data/teamLenses';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { riskTone, readinessTone, recommendationTone } from '@/components/portal/status';
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

export default async function EvaluationOverview({
  params,
}: {
  params: Promise<{ evalId: string }>;
}) {
  const { evalId } = await params;
  const row = await getEvaluation(evalId);
  if (!row) notFound();
  const map = await loadAssessmentMap(evalId);
  const score = computeScoreFromMap(rowToProfile(row), TEAM_LENSES, map);

  return (
    <div className="space-y-6">
      {score.hasCriticalBlocker && (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
          ⛔ Blocked until remediated — a critical blocker is active.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Overall readiness" value={`${score.readiness}/100`} />
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs font-medium text-muted-foreground">Overall risk</div>
          <div className="mt-2"><Badge tone={riskTone(score.risk)}>{score.risk}</Badge></div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs font-medium text-muted-foreground">Recommendation</div>
          <div className="mt-2"><Badge tone={recommendationTone(score.recommendation)}>{score.recommendation}</Badge></div>
        </div>
        <Stat label="Evidence complete" value={`${score.evidenceCompleteness}%`} />
        <Stat label="Blockers" value={score.blockersCount} />
        <Stat label="Controls remaining" value={score.controlsRemaining} />
        <Stat label="Teams ready" value={score.teamsReady} hint={`of ${score.requiredTeams} required`} />
        <Stat label="Teams blocked" value={score.teamsBlocked} />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">Required team readiness</h2>
        </div>
        <div className="divide-y divide-border">
          {Object.values(score.perTeam)
            .filter((t) => t.required)
            .map((t) => (
              <div key={t.teamId} className="flex items-center gap-3 px-4 py-2.5 sm:gap-4">
                <span className="w-36 shrink-0 truncate text-sm sm:w-52">
                  {LENS_BY_ID[t.teamId]?.icon} {LENS_BY_ID[t.teamId]?.title}
                </span>
                <div className="flex-1">
                  <Progress value={t.normalized} showLabel />
                </div>
                {t.escalated && <Badge tone="electric">Escalated</Badge>}
                {t.hasCriticalBlocker && <Badge tone="danger">Blocker</Badge>}
              </div>
            ))}
        </div>
      </div>

      <p className="rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-[oklch(0.45_0.09_75)]">
        {DISCLAIMER}
      </p>
    </div>
  );
}

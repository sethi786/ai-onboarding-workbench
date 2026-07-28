import { notFound } from 'next/navigation';
import { getEvaluation, loadAssessmentMap, rowToProfile } from '@/lib/db/queries';
import { computeScoreFromMap } from '@/workbench/engine/scoring';
import { TEAM_LENSES, LENS_BY_ID } from '@/workbench/data/teamLenses';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { riskTone, recommendationTone } from '@/components/portal/status';
import { ScoreGauge } from '@/components/ui/ScoreGauge';
import { LensIcon } from '@/components/icons/LensIcon';
import { Ban } from 'lucide-react';
import { DISCLAIMER } from '@/lib/site';

function StatLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div>
      <StatLabel>{label}</StatLabel>
      <div className="mt-1 text-[26px] font-semibold leading-none tracking-tight">{value}</div>
      {hint && <div className="mt-1.5 text-xs leading-snug text-muted-foreground">{hint}</div>}
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
        <div className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
          <Ban className="h-4 w-4 shrink-0" /> Blocked until remediated — a critical blocker is active.
        </div>
      )}

      {score.teamsNotStarted > 0 && (
        <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm">
          <span className="font-medium">
            {score.teamsNotStarted} of {score.requiredTeams} required reviews haven&rsquo;t been
            started.
          </span>{' '}
          <span className="text-muted-foreground">
            The readiness figure below covers only the reviews that have been done — nothing can be
            cleared until every required review is complete.
          </span>
        </div>
      )}

      {/* One panel for the state of the review. It used to be two — a gauge
          card and a row of six bordered stat tiles — which reported evidence
          completeness twice, in different type, one above the other. */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex flex-col items-center gap-8 p-6 sm:flex-row sm:gap-12">
          <ScoreGauge value={score.readiness} size={144} />
          <div className="grid flex-1 gap-6 sm:grid-cols-3">
            <div>
              <StatLabel>Overall risk</StatLabel>
              <div className="mt-2">
                <Badge tone={riskTone(score.risk)}>{score.risk}</Badge>
              </div>
            </div>
            <div className="sm:col-span-2">
              <StatLabel>Recommendation</StatLabel>
              <div className="mt-2">
                <Badge tone={recommendationTone(score.recommendation)}>
                  {score.recommendation}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border p-6 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="Evidence complete" value={`${score.evidenceCompleteness}%`} />
          <Stat label="Controls remaining" value={score.controlsRemaining} />
          <Stat
            label="Signed off"
            value={score.teamsSignedOff}
            hint={`of ${score.requiredTeams} required`}
          />
          <Stat label="Blocked" value={score.teamsBlocked} />
          <Stat
            label="Not started"
            value={score.teamsNotStarted}
            hint={score.teamsNotStarted > 0 ? 'Readiness covers only what was reviewed' : undefined}
          />
        </div>
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
                <span className="flex w-36 shrink-0 items-center gap-2 truncate text-sm sm:w-52">
                  <LensIcon id={t.teamId} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{LENS_BY_ID[t.teamId]?.title}</span>
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

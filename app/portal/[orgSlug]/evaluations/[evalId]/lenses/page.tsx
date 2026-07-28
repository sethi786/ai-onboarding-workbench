import { notFound } from 'next/navigation';
import { requireMembership } from '@/lib/auth/membership';
import { getEvaluation, loadAssessmentMap, rowToProfile, loadOrgHistory } from '@/lib/db/queries';
import { computeScoreFromMap } from '@/workbench/engine/scoring';
import { TEAM_LENSES } from '@/workbench/data/teamLenses';
import {
  isApplicable,
  isRequired,
  baseDepth,
  reviewDepth,
  controlsAtDepth,
  evidenceAtDepth,
} from '@/workbench/engine/reviewIntensity';
import { Badge } from '@/components/ui/badge';
import { canEdit } from '@/lib/rbac';
import { isAiConfigured } from '@/lib/ai/client';
import { recallForLens, summarizeRecall } from '@/workbench/engine/memory';
import { LensCard } from '@/components/portal/LensCard';
import { DISCLAIMER } from '@/lib/site';

export default async function LensesPage({
  params,
}: {
  params: Promise<{ orgSlug: string; evalId: string }>;
}) {
  const { orgSlug, evalId } = await params;
  const { org, role } = await requireMembership(orgSlug);
  const row = await getEvaluation(evalId);
  if (!row) notFound();
  const [map, history] = await Promise.all([
    loadAssessmentMap(evalId),
    loadOrgHistory(org.id, evalId),
  ]);
  const profile = rowToProfile(row);
  const score = computeScoreFromMap(profile, TEAM_LENSES, map);
  const editable = canEdit(role);
  const aiAvailable = isAiConfigured();

  // Lenses that don't apply to this kind of tool are out of scope, not merely
  // optional. Listing them alongside the real work is what makes governance
  // feel like paperwork — a CRM adoption shouldn't show an AI Engineering card.
  // What this workspace already answered for comparable tools, per lens. One
  // history load feeds every card — the recall itself is pure and cheap.
  const recallByLens = Object.fromEntries(
    TEAM_LENSES.map((lens) => {
      const depth = reviewDepth(lens, profile);
      return [
        lens.id,
        recallForLens(lens, profile, history, {
          controlIds: controlsAtDepth(lens, depth).map((c) => c.id),
          evidenceIds: evidenceAtDepth(lens, depth).map((e) => e.id),
        }),
      ];
    }),
  );
  const recalledTotal = Object.values(recallByLens).reduce((n, r) => n + r.length, 0);
  const recallSources = summarizeRecall(Object.values(recallByLens).flat()).sources;

  const applicable = TEAM_LENSES.filter((lens) => isApplicable(lens, profile));
  const outOfScope = TEAM_LENSES.filter((lens) => !isApplicable(lens, profile));

  // The size of the job, stated up front. Somebody deciding whether to start
  // deserves to know what they're agreeing to before they scroll.
  const required = TEAM_LENSES.filter((lens) => isRequired(lens, profile));
  const depth = baseDepth(profile);
  const totalControls = required.reduce(
    (n, lens) => n + controlsAtDepth(lens, reviewDepth(lens, profile)).length,
    0,
  );
  const totalEvidence = required.reduce(
    (n, lens) => n + evidenceAtDepth(lens, reviewDepth(lens, profile)).length,
    0,
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold">Your review</h2>
          <Badge tone={depth === 'Deep' ? 'warning' : depth === 'Standard' ? 'trust' : 'neutral'}>
            {depth} depth
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          <strong className="text-foreground">{required.length}</strong> of {TEAM_LENSES.length}{' '}
          reviews apply to this tool, asking{' '}
          <strong className="text-foreground">{totalControls} controls</strong>
          {totalEvidence > 0 ? (
            <>
              {' '}and <strong className="text-foreground">{totalEvidence} documents</strong>
            </>
          ) : (
            ' and no documents'
          )}
          . Depth follows what&rsquo;s at stake — change the environment, data classification, or
          capability flags and this recalculates.
        </p>

        {recalledTotal > 0 && (
          <p className="mt-3 rounded-md bg-trust/8 px-3 py-2 text-sm">
            <strong className="text-foreground">{recalledTotal}</strong> of them you have already
            answered — recalled from{' '}
            {recallSources.slice(0, 3).map((s) => s.toolName).join(', ')}
            {recallSources.length > 3 ? ` and ${recallSources.length - 3} more` : ''}. Each one shows
            its source before you accept it.
          </p>
        )}
      </div>

      <p className="rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-[oklch(0.45_0.09_75)]">
        {DISCLAIMER}
      </p>

      {applicable.map((lens) => (
        <LensCard
          key={lens.id}
          lens={lens}
          assessment={map[lens.id]}
          teamScore={score.perTeam[lens.id]}
          evalId={evalId}
          orgId={org.id}
          orgSlug={orgSlug}
          canEdit={editable}
          aiAvailable={aiAvailable}
          profile={profile}
          recollections={recallByLens[lens.id]}
        />
      ))}

      {outOfScope.length > 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
          <h2 className="text-sm font-semibold">
            {outOfScope.length} {outOfScope.length === 1 ? 'review' : 'reviews'} skipped as out of
            scope
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {outOfScope.map((l) => l.title).join(', ')} — these don’t apply to a{' '}
            {profile.toolCategory.toLowerCase()}
            {profile.selfHosted ? ' you host yourself' : ''}. Change the tool’s category or
            capability flags on the Edit tab and they’ll come back.
          </p>
        </div>
      )}
    </div>
  );
}

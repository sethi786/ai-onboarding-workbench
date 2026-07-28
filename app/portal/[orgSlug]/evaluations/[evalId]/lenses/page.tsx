import { notFound } from 'next/navigation';
import { requireMembership } from '@/lib/auth/membership';
import { getEvaluation, loadAssessmentMap, rowToProfile } from '@/lib/db/queries';
import { computeScoreFromMap } from '@/workbench/engine/scoring';
import { TEAM_LENSES } from '@/workbench/data/teamLenses';
import { isApplicable } from '@/workbench/engine/reviewIntensity';
import { canEdit } from '@/lib/rbac';
import { isAiConfigured } from '@/lib/ai/client';
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
  const map = await loadAssessmentMap(evalId);
  const profile = rowToProfile(row);
  const score = computeScoreFromMap(profile, TEAM_LENSES, map);
  const editable = canEdit(role);
  const aiAvailable = isAiConfigured();

  // Lenses that don't apply to this kind of tool are out of scope, not merely
  // optional. Listing them alongside the real work is what makes governance
  // feel like paperwork — a CRM adoption shouldn't show an AI Engineering card.
  const applicable = TEAM_LENSES.filter((lens) => isApplicable(lens, profile));
  const outOfScope = TEAM_LENSES.filter((lens) => !isApplicable(lens, profile));

  return (
    <div className="space-y-4">
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

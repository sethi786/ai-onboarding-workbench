import { notFound } from 'next/navigation';
import { requireMembership } from '@/lib/auth/membership';
import { getEvaluation, loadAssessmentMap, rowToProfile } from '@/lib/db/queries';
import { computeScoreFromMap } from '@/workbench/engine/scoring';
import { TEAM_LENSES } from '@/workbench/data/teamLenses';
import { canEdit } from '@/lib/rbac';
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
  const score = computeScoreFromMap(rowToProfile(row), TEAM_LENSES, map);
  const editable = canEdit(role);

  return (
    <div className="space-y-4">
      <p className="rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-[oklch(0.45_0.09_75)]">
        {DISCLAIMER}
      </p>
      {TEAM_LENSES.map((lens) => (
        <LensCard
          key={lens.id}
          lens={lens}
          assessment={map[lens.id]}
          teamScore={score.perTeam[lens.id]}
          evalId={evalId}
          orgId={org.id}
          orgSlug={orgSlug}
          canEdit={editable}
        />
      ))}
    </div>
  );
}

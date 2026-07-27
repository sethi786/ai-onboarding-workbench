import { notFound } from 'next/navigation';
import { requireMembership } from '@/lib/auth/membership';
import { getEvaluation, loadAssessmentMap, rowToProfile } from '@/lib/db/queries';
import { computeScoreFromMap } from '@/workbench/engine/scoring';
import { TEAM_LENSES } from '@/workbench/data/teamLenses';
import { canEdit } from '@/lib/rbac';
import { ApprovalsTable } from '@/components/portal/ApprovalsTable';

export default async function ApprovalsPage({
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

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Sign-off matrix across all review lenses. Record the self-evaluation decision per team.
      </p>
      <ApprovalsTable
        assessments={map}
        score={score}
        evalId={evalId}
        orgId={org.id}
        orgSlug={orgSlug}
        canEdit={canEdit(role)}
      />
    </div>
  );
}

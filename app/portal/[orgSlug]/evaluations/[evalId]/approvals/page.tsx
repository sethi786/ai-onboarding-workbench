import { notFound } from 'next/navigation';
import { requireMembership } from '@/lib/auth/membership';
import { getEvaluation, loadAssessmentMap, rowToProfile } from '@/lib/db/queries';
import { computeScoreFromMap } from '@/workbench/engine/scoring';
import { TEAM_LENSES } from '@/workbench/data/teamLenses';
import { canEdit } from '@/lib/rbac';
import { hasFeature } from '@/lib/plans';
import { UpgradeGate } from '@/components/portal/UpgradeGate';
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

  if (!hasFeature(org.plan, 'approvals')) {
    return (
      <UpgradeGate
        feature="approvals"
        plan={org.plan}
        orgSlug={orgSlug}
        description="Track each review team's decision, owner, and conditions in one matrix, so the go/no-go call is a summary rather than an archaeology exercise."
      />
    );
  }

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

import { notFound } from 'next/navigation';
import { requireMembership } from '@/lib/auth/membership';
import { getEvaluation, loadAssessmentMap, rowToProfile } from '@/lib/db/queries';
import { computeScoreFromMap } from '@/workbench/engine/scoring';
import { TEAM_LENSES } from '@/workbench/data/teamLenses';
import { buildReportContext } from '@/workbench/export/reportContext';
import { artifactsFor } from '@/workbench/export/evidenceFactory';
import { makeEmptyAssessment } from '@/workbench/types';
import { canEdit } from '@/lib/rbac';
import { hasFeature } from '@/lib/plans';
import { resolveBranding } from '@/lib/branding';
import { UpgradeGate } from '@/components/portal/UpgradeGate';
import { EvidenceFactoryClient } from '@/components/portal/EvidenceFactoryClient';

export default async function EvidencePage({
  params,
}: {
  params: Promise<{ orgSlug: string; evalId: string }>;
}) {
  const { orgSlug, evalId } = await params;
  const { org, role } = await requireMembership(orgSlug);
  const row = await getEvaluation(evalId);
  if (!row) notFound();

  if (!hasFeature(org.plan, 'evidenceFactory')) {
    return (
      <UpgradeGate
        feature="evidenceFactory"
        plan={org.plan}
        orgSlug={orgSlug}
        description="Generate draft SAR, PIA, architecture, and go/no-go packs straight from this evaluation's data — so you walk into review already prepared."
      />
    );
  }

  const map = await loadAssessmentMap(evalId);
  const profile = rowToProfile(row);
  const score = computeScoreFromMap(profile, TEAM_LENSES, map);
  const ctx = buildReportContext(
    profile,
    score,
    (teamId) => map[teamId] ?? makeEmptyAssessment(teamId),
    new Date().toISOString(),
    resolveBranding(org),
  );

  const artifacts = artifactsFor(profile).map((a) => ({
    id: a.id,
    title: a.title,
    content: a.build(ctx),
  }));

  return (
    <EvidenceFactoryClient
      artifacts={artifacts}
      evalName={row.name}
      evalId={evalId}
      orgId={org.id}
      orgSlug={orgSlug}
      canEdit={canEdit(role)}
    />
  );
}

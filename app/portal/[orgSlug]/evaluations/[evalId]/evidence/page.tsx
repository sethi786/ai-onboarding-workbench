import { notFound } from 'next/navigation';
import { requireMembership } from '@/lib/auth/membership';
import { getEvaluation, loadAssessmentMap, rowToProfile } from '@/lib/db/queries';
import { computeScoreFromMap } from '@/workbench/engine/scoring';
import { TEAM_LENSES } from '@/workbench/data/teamLenses';
import { buildReportContext } from '@/workbench/export/reportContext';
import { EVIDENCE_ARTIFACTS } from '@/workbench/export/evidenceFactory';
import { makeEmptyAssessment } from '@/workbench/types';
import { canEdit } from '@/lib/rbac';
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
  const map = await loadAssessmentMap(evalId);
  const profile = rowToProfile(row);
  const score = computeScoreFromMap(profile, TEAM_LENSES, map);
  const ctx = buildReportContext(
    profile,
    score,
    (teamId) => map[teamId] ?? makeEmptyAssessment(teamId),
    new Date().toISOString(),
  );

  const artifacts = EVIDENCE_ARTIFACTS.map((a) => ({
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

import { notFound } from 'next/navigation';
import { requireMembership } from '@/lib/auth/membership';
import { getEvaluation, loadAssessmentMap, rowToProfile, getWorkflow } from '@/lib/db/queries';
import { computeScoreFromMap } from '@/workbench/engine/scoring';
import { TEAM_LENSES } from '@/workbench/data/teamLenses';
import { buildReportContext } from '@/workbench/export/reportContext';
import { buildDiagrams } from '@/workbench/diagrams';
import { makeEmptyAssessment } from '@/workbench/types';
import { resolveBranding } from '@/lib/branding';
import { DiagramCard } from '@/components/portal/DiagramCard';

/**
 * Deliberately ungated on every plan.
 *
 * These are generated from answers the customer already gave, they cost nothing
 * per view, and a data-flow diagram pasted into a security questionnaire is the
 * most persuasive thing this product produces. Charging for it would be
 * charging for the demo.
 */
export default async function DiagramsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; evalId: string }>;
}) {
  const { orgSlug, evalId } = await params;
  const { org } = await requireMembership(orgSlug);
  const row = await getEvaluation(evalId);
  if (!row) notFound();

  const [map, stages] = await Promise.all([loadAssessmentMap(evalId), getWorkflow(evalId)]);
  const profile = rowToProfile(row);
  const score = computeScoreFromMap(profile, TEAM_LENSES, map);
  const ctx = buildReportContext(
    profile,
    score,
    (teamId) => map[teamId] ?? makeEmptyAssessment(teamId),
    new Date().toISOString(),
    resolveBranding(org),
  );
  const diagrams = buildDiagrams(ctx, stages);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-semibold">Diagrams</h1>
        <p className="text-sm text-muted-foreground">
          Drawn from this evaluation’s own answers, so they can’t drift from the assessment the way
          a hand-maintained slide does. They update the moment an answer changes.
        </p>
      </div>

      {diagrams.map((d) => (
        <DiagramCard
          key={d.id}
          id={d.id}
          title={d.title}
          purpose={d.purpose}
          svg={d.svg}
          mermaid={d.mermaid}
          evalName={row.name}
        />
      ))}
    </div>
  );
}

export const dynamic = 'force-dynamic';

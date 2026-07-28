import { notFound } from 'next/navigation';
import { requireMembership } from '@/lib/auth/membership';
import { getEvaluation, loadAssessmentMap, rowToProfile, listReports, getWorkflow } from '@/lib/db/queries';
import { computeScoreFromMap } from '@/workbench/engine/scoring';
import { TEAM_LENSES } from '@/workbench/data/teamLenses';
import { buildReportContext } from '@/workbench/export/reportContext';
import { toMarkdownReport } from '@/workbench/export/toMarkdownReport';
import { toCsv } from '@/workbench/export/toCsv';
import { toProfileJson } from '@/workbench/export/toJson';
import { toGoNoGoReport } from '@/workbench/export/toGoNoGoReport';
import { toRemediationPlan } from '@/workbench/export/toRemediationPlan';
import { makeEmptyAssessment } from '@/workbench/types';
import { slug } from '@/workbench/export/download';
import { ExportsClient } from '@/components/portal/ExportsClient';
import { toBrandedHtml } from '@/workbench/export/toBrandedHtml';
import { buildDiagrams } from '@/workbench/diagrams';
import { BrandedDocumentButton } from '@/components/portal/BrandedDocumentButton';
import { AiReviewAssist } from '@/components/portal/AiReviewAssist';
import { EssentialsNotice } from '@/components/portal/EssentialsNotice';
import { missingEssentials } from '@/workbench/engine/essentials';
import { isAiConfigured } from '@/lib/ai/client';
import { resolveBranding, isBranded } from '@/lib/branding';
import { SITE } from '@/lib/site';
import Link from 'next/link';
import { hasFeature } from '@/lib/plans';
import { UpgradeGate } from '@/components/portal/UpgradeGate';
import { Badge } from '@/components/ui/badge';

export default async function ExportsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; evalId: string }>;
}) {
  const { orgSlug, evalId } = await params;
  const { org } = await requireMembership(orgSlug);
  const row = await getEvaluation(evalId);
  if (!row) notFound();

  if (!hasFeature(org.plan, 'exports')) {
    return (
      <UpgradeGate
        feature="exports"
        plan={org.plan}
        orgSlug={orgSlug}
        description="Download machine-readable data and review-ready reports — go/no-go packs, remediation plans, CSV, and JSON — for this evaluation."
      />
    );
  }

  const [map, stages] = await Promise.all([loadAssessmentMap(evalId), getWorkflow(evalId)]);
  const profile = rowToProfile(row);
  const score = computeScoreFromMap(profile, TEAM_LENSES, map);
  const getAssessment = (teamId: (typeof TEAM_LENSES)[number]['id']) =>
    map[teamId] ?? makeEmptyAssessment(teamId);
  const brand = resolveBranding(org);
  const ctx = buildReportContext(profile, score, getAssessment, new Date().toISOString(), brand);
  const brandedHtml = toBrandedHtml(ctx, brand, {
    title: 'Tool Adoption Review',
    producedWith: `Prepared with ${SITE.name}`,
    // Diagrams go into the document as inline SVG, so the PDF a reviewer
    // receives carries them without any renderer or network access.
    sections: buildDiagrams(ctx, stages).map((d) => ({
      title: d.title,
      paragraphs: [d.purpose],
      html: d.svg,
    })),
  });

  const bundle = {
    base: slug(row.name),
    json: toProfileJson(profile, getAssessment),
    csv: toCsv(ctx),
    markdown: toMarkdownReport(ctx),
    gonogo: toGoNoGoReport(ctx),
    remediation: toRemediationPlan(ctx),
  };

  const reports = await listReports(evalId);

  return (
    <div className="space-y-6">
      <EssentialsNotice
        missing={missingEssentials(profile)}
        editHref={`/portal/${orgSlug}/evaluations/${evalId}/edit`}
      />

      <div>
        <h2 className="mb-1 font-semibold">Branded review document</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          A cover-paged, print-ready document in {brand.organizationName}’s branding — the artifact
          you attach to an approval, send to a customer’s security team, or take into a risk
          committee.
        </p>
        <BrandedDocumentButton
          html={brandedHtml}
          fileName={`${slug(row.name)}-review.html`}
        />
        {!isBranded(brand) && (
          <p className="mt-2 text-xs text-muted-foreground">
            Using default branding.{' '}
            <Link
              href={`/portal/${orgSlug}/settings/organization`}
              className="text-electric hover:underline"
            >
              Add your logo and colour
            </Link>{' '}
            and every document picks it up.
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-1 font-semibold">Download</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Machine-readable data and review-ready reports for {row.name}.
        </p>
        <ExportsClient bundle={bundle} />
      </div>

      <AiReviewAssist evalId={evalId} available={isAiConfigured()} />

      <div>
        <h2 className="mb-1 font-semibold">Saved reports</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No saved reports yet. Generate and save artifacts from the Evidence Factory.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {reports.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="font-medium">{r.title}</span>
                <Badge tone="neutral">{r.kind}</Badge>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

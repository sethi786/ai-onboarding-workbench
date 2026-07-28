import { toBrandedHtml, esc } from '@/workbench/export/toBrandedHtml';
import { buildDiagrams } from '@/workbench/diagrams';
import { allCoverage } from '@/workbench/engine/frameworkCoverage';
import { FRAMEWORK_DISCLAIMER } from '@/workbench/data/frameworks';
import { TEAM_LENSES } from '@/workbench/data/teamLenses';
import { SITE } from '@/lib/site';
import type { ReportContext } from '@/workbench/export/reportContext';
import type { DocumentBrand, TeamAssessment, TeamId, WorkflowStage } from '@/workbench/types';

/**
 * Assemble the branded review document — the artifact this product exists to
 * produce.
 *
 * This lives outside the portal route because the marketing site publishes a
 * finished example of it. If the two were assembled separately, the example
 * would eventually become a nicer document than the one customers get. Sharing
 * the builder makes that impossible: what a visitor previews is byte-for-byte
 * what the portal hands them.
 */

function frameworkSections(
  ctx: ReportContext,
  getAssessment: (id: TeamId) => TeamAssessment,
) {
  return allCoverage(ctx.profile, TEAM_LENSES, getAssessment).map((f) => ({
    title: `${f.framework.name} — evidence map`,
    paragraphs: [f.framework.authority, FRAMEWORK_DISCLAIMER],
    html:
      '<table><thead><tr><th>Reference</th><th>Obligation</th><th>Status</th><th class="num">Evidenced</th></tr></thead><tbody>' +
      f.clauses
        .map(
          (c) =>
            `<tr><td>${esc(c.clause.ref)}</td><td>${esc(c.clause.title)}</td>` +
            `<td>${esc(
              c.status === 'out-of-scope'
                ? 'Out of scope for this tool'
                : c.status === 'covered'
                  ? 'Evidenced'
                  : c.status === 'partial'
                    ? 'Partly evidenced'
                    : 'Not started',
            )}</td>` +
            `<td class="num">${c.status === 'out-of-scope' ? '—' : Math.round(c.completeness * 100) + '%'}</td></tr>`,
        )
        .join('') +
      '</tbody></table>',
  }));
}

export function buildReviewDocument(
  ctx: ReportContext,
  brand: DocumentBrand,
  stages: WorkflowStage[],
  getAssessment: (id: TeamId) => TeamAssessment,
): string {
  return toBrandedHtml(ctx, brand, {
    title: 'Tool Adoption Review',
    producedWith: `Prepared with ${SITE.name}`,
    // Diagrams go into the document as inline SVG, so the PDF a reviewer
    // receives carries them without any renderer or network access.
    sections: [
      ...buildDiagrams(ctx, stages).map((d) => ({
        title: d.title,
        paragraphs: [d.purpose],
        html: d.svg,
      })),
      // The regulatory table is the reason a compliance officer keeps this
      // document rather than filing it.
      ...frameworkSections(ctx, getAssessment),
    ],
  });
}

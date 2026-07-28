import { TOOL_TEMPLATE_BY_ID } from '@/data/tool-templates';
import { TEAM_LENSES, LENS_BY_ID } from '@/workbench/data/teamLenses';
import { computeScoreFromMap } from '@/workbench/engine/scoring';
import { buildReportContext } from '@/workbench/export/reportContext';
import { buildDiagrams } from '@/workbench/diagrams';
import { makeDefaultWorkflow } from '@/workbench/data/workflowStages';
import { allCoverage } from '@/workbench/engine/frameworkCoverage';
import {
  isRequired,
  baseDepth,
  reviewDepth,
  controlsAtDepth,
  evidenceAtDepth,
} from '@/workbench/engine/reviewIntensity';
import { buildReviewDocument } from '@/lib/review-document';
import { makeEmptyAssessment } from '@/workbench/types';
import type { DocumentBrand, Profile, TeamAssessment, TeamId } from '@/workbench/types';

/**
 * A finished review, built at build time by the real engine.
 *
 * The marketing site used to describe the output in adjectives. Everything
 * below is produced by the same modules the product runs — the same scorer, the
 * same scope rules, the same diagram generators — so what a visitor sees on the
 * homepage is literally what the tool makes, not a designer's impression of it.
 * If the engine changes, this page changes with it, which also means it can
 * never quietly drift into a promise the product doesn't keep.
 */

const TEMPLATE = TOOL_TEMPLATE_BY_ID['m365-copilot'];

const PROFILE: Profile = {
  id: 'demo',
  name: 'Microsoft 365 Copilot',
  platform: 'Microsoft',
  toolCategory: 'AI / ML system',
  toolType: TEMPLATE.toolType,
  useCase: 'Drafting, summarising, and search across Word, Outlook, and Teams',
  businessOwner: 'Dana Okafor, VP Operations',
  technicalOwner: 'Sam Reyes, IT Director',
  executiveSponsor: 'COO',
  targetUsers: '240 staff across Finance, Legal, and Operations',
  dataTypes: TEMPLATE.defaults.dataTypes ?? [],
  dataClassification: 'Confidential',
  environment: 'Pilot',
  model: 'GPT-4o (Copilot)',
  agentEnabled: false,
  connectorEnabled: true,
  ragEnabled: true,
  externalVendor: true,
  clientData: false,
  pii: true,
  autonomousActions: false,
  selfHosted: false,
  createdAt: '',
  updatedAt: '',
};

/** A believable mid-review state: most work done, the real Copilot risk open. */
function assessments(): Record<TeamId, TeamAssessment> {
  const map = {} as Record<TeamId, TeamAssessment>;
  for (const lens of TEAM_LENSES) map[lens.id] = makeEmptyAssessment(lens.id);

  for (const lens of TEAM_LENSES.filter((l) => isRequired(l, PROFILE))) {
    const a = map[lens.id];
    const depth = reviewDepth(lens, PROFILE);
    a.score = 4;
    a.decision = 'Approved with Conditions';
    a.owner = 'A. Reviewer';
    controlsAtDepth(lens, depth).forEach((c, i) => {
      if (i % 5 !== 0) a.checkedControls[c.id] = true;
    });
    evidenceAtDepth(lens, depth).forEach((e, i) => {
      if (i % 4 !== 0) a.checkedEvidence[e.id] = true;
    });
  }

  // Graph oversharing — the finding that actually decides a Copilot rollout.
  const dg = LENS_BY_ID['data-governance'];
  map['data-governance'].activeBlockers[dg.blockers[0].id] = true;
  map['data-governance'].decision = 'Needs Remediation';
  map['data-governance'].notes =
    'Copilot inherits existing Microsoft 365 permissions. Files over-shared today become searchable by everyone tomorrow. A permissions and sensitivity-label review has to land before the pilot widens.';

  return map;
}

const MAP = assessments();
const SCORE = computeScoreFromMap(PROFILE, TEAM_LENSES, MAP);

const BRAND: DocumentBrand = {
  organizationName: 'Northwind Holdings',
  legalName: 'Northwind Holdings Inc.',
  logoUrl: null,
  primaryColor: '#2B4C7E',
  confidentialityLabel: 'Confidential — Internal Use Only',
  documentFooter: '© Northwind Holdings Inc.',
};

const CTX = buildReportContext(
  PROFILE,
  SCORE,
  (id) => MAP[id] ?? makeEmptyAssessment(id),
  'Reviewed July 2026',
  BRAND,
);

const REQUIRED = TEAM_LENSES.filter((l) => isRequired(l, PROFILE));
const STAGES = makeDefaultWorkflow(PROFILE);

/**
 * The finished review document, assembled by the same builder the portal uses.
 * Published at /example-review so a visitor can read the actual deliverable
 * before signing up — the single most convincing thing this product has.
 */
export const DEMO_DOCUMENT_HTML = buildReviewDocument(CTX, BRAND, STAGES, (id) =>
  MAP[id] ?? makeEmptyAssessment(id),
);

export const DEMO = {
  toolName: PROFILE.name,
  orgName: 'Northwind Holdings',
  score: SCORE,
  depth: baseDepth(PROFILE),

  lensesRequired: REQUIRED.length,
  lensesTotal: TEAM_LENSES.length,
  lensesSkipped: TEAM_LENSES.filter((l) => !isRequired(l, PROFILE)).map((l) => l.title),

  controlsAsked: REQUIRED.reduce(
    (n, l) => n + controlsAtDepth(l, reviewDepth(l, PROFILE)).length,
    0,
  ),
  controlsIfUnscoped: TEAM_LENSES.reduce((n, l) => n + l.requiredControls.length, 0),

  /** The real generated diagrams — inline SVG, straight from the engine. */
  diagrams: buildDiagrams(CTX, STAGES),

  /** Regulatory mapping, computed the same way the product computes it. */
  frameworks: allCoverage(PROFILE, TEAM_LENSES, (id) => MAP[id] ?? makeEmptyAssessment(id)),

  /** The per-team table that fronts the review document. */
  teams: CTX.teams
    .filter((t) => t.required)
    .map((t) => ({
      title: t.lens.title,
      readiness: t.normalized,
      decision: t.assessment.decision,
      blockers: t.activeBlockerLabels.length,
      depth: reviewDepth(t.lens, PROFILE),
    })),

  blockers: CTX.teams
    .filter((t) => t.required && t.activeBlockerLabels.length > 0)
    .map((t) => ({ team: t.lens.title, items: t.activeBlockerLabels })),
};

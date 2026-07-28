/**
 * Renders a sample branded review document to /tmp so the print layout can be
 * eyeballed without a database. Dev-only: `npx tsx scripts/preview-branded-doc.ts`.
 */
import { writeFileSync } from 'node:fs';
import { computeScoreFromMap } from '../workbench/engine/scoring';
import { TEAM_LENSES } from '../workbench/data/teamLenses';
import { buildReportContext } from '../workbench/export/reportContext';
import { toBrandedHtml } from '../workbench/export/toBrandedHtml';
import { makeEmptyAssessment } from '../workbench/types';
import type { Profile, TeamAssessment, TeamId } from '../workbench/types';

const profile: Profile = {
  id: 'demo',
  name: 'Northwind CRM',
  platform: 'Northwind Software',
  toolCategory: 'SaaS application',
  toolType: 'Business SaaS application',
  useCase: 'Replace the legacy sales pipeline tracker',
  businessOwner: 'Dana Okafor',
  technicalOwner: 'Sam Reyes',
  executiveSponsor: 'VP Revenue Operations',
  targetUsers: '180 sellers and sales ops',
  dataTypes: ['Client Data', 'Personal Data (PII)'],
  dataClassification: 'Confidential',
  environment: 'Production',
  model: '',
  agentEnabled: false,
  connectorEnabled: true,
  ragEnabled: false,
  externalVendor: true,
  clientData: true,
  pii: true,
  autonomousActions: false,
  selfHosted: false,
  createdAt: '',
  updatedAt: '',
};

const map = {} as Record<TeamId, TeamAssessment>;
for (const [i, lens] of TEAM_LENSES.entries()) {
  const a = makeEmptyAssessment(lens.id);
  a.score = (i % 4) + 2;
  lens.requiredControls.forEach((c, j) => {
    if (j % 3 !== 0) a.checkedControls[c.id] = true;
  });
  lens.evidenceRequired.forEach((e, j) => {
    if (j % 2 === 0) a.checkedEvidence[e.id] = true;
  });
  a.decision = i % 5 === 0 ? 'Needs Remediation' : 'Approved with Conditions';
  map[lens.id] = a;
}
map['security-sar'].activeBlockers['sar-b1'] = true;

const score = computeScoreFromMap(profile, TEAM_LENSES, map);
const ctx = buildReportContext(
  profile,
  score,
  (id) => map[id] ?? makeEmptyAssessment(id),
  '2026-07-28T10:00:00.000Z',
  {
    organizationName: 'Northwind Holdings Inc.',
    legalName: 'Northwind Holdings Inc.',
    logoUrl: null,
    primaryColor: '#2B4C7E',
    confidentialityLabel: 'Confidential — Internal Use Only',
    documentFooter: '© Northwind Holdings Inc. Not for external distribution.',
  },
);

const out = '/tmp/branded-doc.html';
writeFileSync(out, toBrandedHtml(ctx, ctx.brand!, { title: 'Tool Adoption Review', producedWith: 'Prepared with Aegis' }));
console.log(`wrote ${out}`);

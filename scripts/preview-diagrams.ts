/**
 * Renders every diagram to /tmp for a visual check. Dev-only:
 * `npx tsx scripts/preview-diagrams.ts`.
 */
import { writeFileSync } from 'node:fs';
import { computeScoreFromMap } from '../workbench/engine/scoring';
import { TEAM_LENSES } from '../workbench/data/teamLenses';
import { buildReportContext } from '../workbench/export/reportContext';
import { buildDiagrams } from '../workbench/diagrams';
import { makeDefaultWorkflow } from '../workbench/data/workflowStages';
import { makeEmptyAssessment } from '../workbench/types';
import type { Profile, TeamAssessment, TeamId } from '../workbench/types';

const profile: Profile = {
  id: 'demo',
  name: 'Northwind CRM',
  platform: 'Northwind Software',
  toolCategory: 'SaaS application',
  toolType: 'Business SaaS application',
  useCase: '',
  businessOwner: 'Dana Okafor',
  technicalOwner: 'Sam Reyes',
  executiveSponsor: '',
  targetUsers: 'Sales & sales ops',
  dataTypes: ['Client Data', 'Personal Data (PII)', 'Internal Documents'],
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
  a.score = (i % 5) + 1;
  lens.requiredControls.forEach((c, j) => {
    if (j % 3 !== 0) a.checkedControls[c.id] = true;
  });
  lens.evidenceRequired.forEach((e, j) => {
    if (j % 2 === 0) a.checkedEvidence[e.id] = true;
  });
  map[lens.id] = a;
}
map['security-sar'].activeBlockers['sar-b1'] = true;

const score = computeScoreFromMap(profile, TEAM_LENSES, map);
const ctx = buildReportContext(profile, score, (id) => map[id] ?? makeEmptyAssessment(id), 'now', {
  organizationName: 'Northwind Holdings Inc.',
  legalName: 'Northwind Holdings Inc.',
  logoUrl: null,
  primaryColor: '#2B4C7E',
  confidentialityLabel: 'Confidential',
  documentFooter: null,
});

const stages = makeDefaultWorkflow().slice(0, 12);
stages[0].status = 'Complete';
stages[1].status = 'Complete';
stages[2].status = 'Skipped';
stages[3].status = 'In Progress';
stages[5].status = 'Blocked';

const diagrams = buildDiagrams(ctx, stages);
const html = `<!doctype html><meta charset="utf-8"><style>
body{font:14px ui-sans-serif,system-ui;background:#F4F2EE;margin:0;padding:28px}
section{background:#fff;border:1px solid #E6E2DA;border-radius:12px;padding:22px;margin-bottom:22px}
h2{margin:0 0 4px;font-size:17px}p{margin:0 0 16px;color:#6B6B6B;font-size:12.5px}
</style>${diagrams
  .map((d) => `<section><h2>${d.title}</h2><p>${d.purpose}</p>${d.svg}</section>`)
  .join('')}`;

writeFileSync('/tmp/diagrams.html', html);
console.log('wrote /tmp/diagrams.html');

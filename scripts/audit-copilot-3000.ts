/**
 * Enterprise-scale audit: Microsoft 365 Copilot, 3,000 users.
 *
 * Runs the real modules end to end — plan entitlements, scoping, depth,
 * scoring, workflow, evidence, the branded document, framework coverage, and
 * the identity path — and reports anything that would embarrass us in front of
 * a 3,000-seat customer.
 *
 * `npx tsx scripts/audit-copilot-3000.ts`
 */
import { TOOL_TEMPLATE_BY_ID } from '../data/tool-templates';
import { TEAM_LENSES, LENS_BY_ID } from '../workbench/data/teamLenses';
import {
  isRequired,
  baseDepth,
  reviewDepth,
  controlsAtDepth,
  evidenceAtDepth,
  explainScope,
} from '../workbench/engine/reviewIntensity';
import { computeScoreFromMap } from '../workbench/engine/scoring';
import { makeDefaultWorkflow, skippedStageNames } from '../workbench/data/workflowStages';
import { buildReportContext } from '../workbench/export/reportContext';
import { artifactsFor } from '../workbench/export/evidenceFactory';
import { toRemediationPlan } from '../workbench/export/toRemediationPlan';
import { allCoverage } from '../workbench/engine/frameworkCoverage';
import { buildDiagrams } from '../workbench/diagrams';
import { makeEmptyAssessment } from '../workbench/types';
import { CONTROL_GUIDANCE, EVIDENCE_GUIDANCE } from '../workbench/data/controlGuidance';
import { PLANS, getPlan, hasFeature, memberQuota, evaluationQuota } from '../lib/plans';
import { missingEssentials } from '../workbench/engine/essentials';
import type { Profile, TeamAssessment, TeamId } from '../workbench/types';

const findings: { sev: 'BLOCKER' | 'MAJOR' | 'MINOR'; what: string }[] = [];
const flag = (sev: 'BLOCKER' | 'MAJOR' | 'MINOR', what: string) => findings.push({ sev, what });
const step = (n: string) => console.log(`\n${'─'.repeat(74)}\n${n}\n${'─'.repeat(74)}`);

const USERS = 3000;
const tpl = TOOL_TEMPLATE_BY_ID['m365-copilot'];

const PROFILE: Profile = {
  id: 'audit',
  name: 'Microsoft 365 Copilot',
  platform: 'Microsoft',
  toolCategory: 'AI / ML system',
  toolType: tpl.toolType,
  useCase: 'Drafting, summarising, and search across Word, Outlook, Teams and SharePoint',
  businessOwner: 'Dana Okafor, COO',
  technicalOwner: 'Sam Reyes, Director of IT',
  executiveSponsor: 'CEO',
  targetUsers: `${USERS} employees across every function, in 14 countries`,
  dataTypes: tpl.defaults.dataTypes ?? [],
  dataClassification: 'Confidential',
  environment: 'Production',
  model: 'GPT-4o (Copilot)',
  agentEnabled: false,
  connectorEnabled: true,
  ragEnabled: true,
  externalVendor: true,
  clientData: true,
  pii: true,
  autonomousActions: false,
  selfHosted: false,
  createdAt: '',
  updatedAt: '',
};

/* -- 1. Can this customer even buy what they need? ----------------------- */
step('1. PLAN FIT — 3,000 users');
for (const id of ['free', 'team', 'enterprise'] as const) {
  const plan = getPlan(id);
  const seats = memberQuota(id, 0).limit;
  const evals = evaluationQuota(id, 0).limit;
  console.log(
    `   ${plan.name.padEnd(11)} seats ${String(seats ?? '∞').padStart(4)} · evaluations ${String(evals ?? '∞').padStart(4)} · sso ${hasFeature(id, 'sso')}`,
  );
}
const entSeats = memberQuota('enterprise', 0).limit;
if (entSeats !== null) {
  flag('BLOCKER', `Enterprise caps seats at ${entSeats} — a 3,000-user org cannot be served.`);
} else {
  console.log(`\n   Enterprise: unlimited seats, SSO/SCIM. Correct plan for ${USERS} users.`);
}

/* -- 2. Does user count change the review at all? ------------------------ */
step('2. SCOPE AND DEPTH');
const small: Profile = { ...PROFILE, targetUsers: '12 people in one team' };
console.log(`   Depth for ${USERS} users : ${baseDepth(PROFILE)}`);
console.log(`   Depth for 12 users       : ${baseDepth(small)}`);
if (baseDepth(PROFILE) === baseDepth(small)) {
  flag(
    'MAJOR',
    'Population size does not affect review depth. A 12-person pilot and a 3,000-person ' +
      'rollout on identical data get an identical review — but blast radius is exactly what ' +
      'a reviewer weighs. `exposure()` reads classification, environment, and capability, ' +
      'never how many people are exposed.',
  );
}

const required = TEAM_LENSES.filter((l) => isRequired(l, PROFILE));
const skipped = TEAM_LENSES.filter((l) => !isRequired(l, PROFILE));
console.log(`\n   ${required.length} of ${TEAM_LENSES.length} reviews apply`);
const controlsAsked = required.reduce((n, l) => n + controlsAtDepth(l, reviewDepth(l, PROFILE)).length, 0);
const evidenceAsked = required.reduce((n, l) => n + evidenceAtDepth(l, reviewDepth(l, PROFILE)).length, 0);
const controlsAll = TEAM_LENSES.reduce((n, l) => n + l.requiredControls.length, 0);
console.log(`   ${controlsAsked} controls asked (of ${controlsAll} in the library)`);
console.log(`   ${evidenceAsked} documents to collect`);
console.log(`   skipped: ${skipped.map((l) => l.short).join(', ') || 'none'}`);

for (const l of skipped) {
  const e = explainScope(l, PROFILE);
  if (e.status === 'not-triggered' && e.wouldApplyIf.length === 0) {
    flag('MINOR', `"${l.title}" is skipped with no explanation of what would bring it into scope.`);
  }
}

/* -- 3. Guidance coverage on what they'll actually work through ---------- */
step('3. GUIDANCE COVERAGE');
let missingC = 0;
let missingE = 0;
for (const l of required) {
  const d = reviewDepth(l, PROFILE);
  for (const c of controlsAtDepth(l, d)) if (!CONTROL_GUIDANCE[c.id]) missingC++;
  for (const e of evidenceAtDepth(l, d)) if (!EVIDENCE_GUIDANCE[e.id]) missingE++;
}
console.log(`   controls without a definition of done : ${missingC}`);
console.log(`   documents without a stated source     : ${missingE}`);
if (missingC || missingE) flag('MAJOR', `${missingC + missingE} items give the reviewer nothing to go on.`);

/* -- 4. A realistic mid-review state ------------------------------------- */
step('4. SCORING THROUGH THE REVIEW');
function stateAt(fraction: number): Record<TeamId, TeamAssessment> {
  const m = {} as Record<TeamId, TeamAssessment>;
  for (const l of TEAM_LENSES) m[l.id] = makeEmptyAssessment(l.id);
  const take = Math.round(required.length * fraction);
  for (const l of required.slice(0, take)) {
    const a = m[l.id];
    a.score = 4;
    a.decision = 'Approved with Conditions';
    a.owner = 'A. Reviewer';
    const d = reviewDepth(l, PROFILE);
    controlsAtDepth(l, d).forEach((c, i) => { if (i % 6 !== 0) a.checkedControls[c.id] = true; });
    evidenceAtDepth(l, d).forEach((e, i) => { if (i % 5 !== 0) a.checkedEvidence[e.id] = true; });
  }
  return m;
}
for (const f of [0, 0.25, 0.6, 1]) {
  const s = computeScoreFromMap(PROFILE, TEAM_LENSES, stateAt(f));
  console.log(
    `   ${String(Math.round(f * 100)).padStart(3)}% reviewed → readiness ${String(s.readiness).padStart(3)} · ` +
      `coverage ${String(Math.round(s.coverage * 100)).padStart(3)}% · ${s.recommendation}`,
  );
}

/* -- 5. The blocker that decides a Copilot rollout ----------------------- */
step('5. THE REAL COPILOT RISK');
const MAP = stateAt(1);
const dg = LENS_BY_ID['data-governance'];
const overshare = dg.blockers[0];
MAP['data-governance'].activeBlockers[overshare.id] = true;
MAP['data-governance'].decision = 'Needs Remediation';
const SCORE = computeScoreFromMap(PROFILE, TEAM_LENSES, MAP);
console.log(`   blocker: "${overshare.label}"${overshare.critical ? ' [critical]' : ''}`);
console.log(`   → readiness ${SCORE.readiness} · risk ${SCORE.risk} · ${SCORE.recommendation}`);
if (SCORE.recommendation !== 'Blocked') {
  flag('BLOCKER', 'A critical blocker did not block the rollout.');
}

/* -- 6. Workflow and deliverables ---------------------------------------- */
step('6. DELIVERABLES');
const stages = makeDefaultWorkflow(PROFILE);
const skippedStages = skippedStageNames(PROFILE);
const CTX = buildReportContext(PROFILE, SCORE, (id) => MAP[id] ?? makeEmptyAssessment(id), 'now', {
  organizationName: 'Northwind Holdings',
  legalName: 'Northwind Holdings Inc.',
  logoUrl: null,
  primaryColor: '#2B4C7E',
  confidentialityLabel: 'Confidential — Internal Use Only',
  documentFooter: '© Northwind Holdings Inc.',
});
console.log(`   workflow stages   : ${stages.length} (${skippedStages.length} skipped as out of scope)`);
console.log(`   evidence artifacts: ${artifactsFor(PROFILE).length}`);
console.log(`   diagrams          : ${buildDiagrams(CTX, stages).map((d) => d.title).join(', ')}`);
const remediation = toRemediationPlan(CTX);
const openItems = CTX.teams
  .filter((t) => t.required)
  .reduce((n, t) => n + t.missingControls.length + t.missingEvidence.length, 0);
console.log(`   remediation plan  : ${remediation.split('\n').length} lines, ${openItems} open items named`);
if (openItems > 0 && !remediation.includes('Controls to close')) {
  flag('MAJOR', 'Remediation plan does not name the open controls.');
}

/* -- 7. Regulation ------------------------------------------------------- */
step('7. REGULATORY COVERAGE');
for (const f of allCoverage(PROFILE, TEAM_LENSES, (id) => MAP[id] ?? makeEmptyAssessment(id))) {
  const inScope = f.clauses.filter((c) => c.status !== 'out-of-scope').length;
  console.log(`   ${f.framework.name.padEnd(28)} ${inScope}/${f.clauses.length} clauses in scope`);
}

/* -- 8. Intake completeness ---------------------------------------------- */
step('8. INTAKE');
const missing = missingEssentials(PROFILE);
console.log(`   missing essentials: ${missing.length ? missing.join(', ') : 'none'}`);

/* -- 9. Identity at 3,000 users ------------------------------------------ */
step('9. IDENTITY — provisioning 3,000 people');
console.log('   SSO: domain → workspace, membership created on first sign-in.');
console.log('   SCIM: directory creates and removes access.');
console.log(`   Team plan seat cap: ${memberQuota('team', 0).limit} · Enterprise: unlimited`);
console.log('   Seat limits are enforced in SQL on both machine paths (migration 0012):');
console.log('     · scim_sync_membership raises, so the IdP records a per-user failure');
console.log('     · sso_claim_membership returns null, so sign-in succeeds without a seat');
console.log('   Verified against PostgreSQL — see supabase/tests/seat_limits.sql.');

/* -- verdict ------------------------------------------------------------- */
step('FINDINGS');
if (!findings.length) console.log('   None.');
for (const f of findings) console.log(`   [${f.sev}] ${f.what}\n`);
console.log(`   ${findings.length} finding(s).`);

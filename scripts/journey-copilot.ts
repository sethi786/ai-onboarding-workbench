/**
 * End-to-end customer journey, run through the real application code.
 *
 * Walks a workspace adopting Microsoft 365 Copilot from library template to
 * finished review pack, using the same modules the portal uses — the template
 * defaults, the mappers, the scoping engine, the scorer, the workflow, the
 * evidence builders, the diagram generators, and the branded document.
 *
 * Dev-only: `npx tsx scripts/journey-copilot.ts`
 */
import { writeFileSync } from 'node:fs';
import { TOOL_TEMPLATE_BY_ID } from '../data/tool-templates';
import { profilePatchToRow, assessmentPatchToRow, rowToProfile } from '../lib/db/mappers';
import { TEAM_LENSES, LENS_BY_ID } from '../workbench/data/teamLenses';
import { isApplicable, isRequired, escalatedLensIds } from '../workbench/engine/reviewIntensity';
import { computeScoreFromMap } from '../workbench/engine/scoring';
import { makeDefaultWorkflow } from '../workbench/data/workflowStages';
import { buildReportContext } from '../workbench/export/reportContext';
import { EVIDENCE_ARTIFACTS } from '../workbench/export/evidenceFactory';
import { toBrandedHtml } from '../workbench/export/toBrandedHtml';
import { toGoNoGoReport } from '../workbench/export/toGoNoGoReport';
import { buildDiagrams } from '../workbench/diagrams';
import { makeEmptyAssessment } from '../workbench/types';
import { resolveBranding } from '../lib/branding';
import type { TeamAssessment, TeamId } from '../workbench/types';

const problems: string[] = [];
const note = (s: string) => problems.push(s);

function step(n: string) {
  console.log(`\n${'='.repeat(72)}\n${n}\n${'='.repeat(72)}`);
}

/* -- STEP 1: pick the template ------------------------------------------- */
step('1. Customer picks "Microsoft 365 Copilot" from the tool library');

const tpl = TOOL_TEMPLATE_BY_ID['m365-copilot'];
console.log(`   ${tpl.name} — ${tpl.vendor} · ${tpl.category}`);
console.log(`   ${tpl.summary}`);
console.log(`   Prefilled flags:`, JSON.stringify(tpl.defaults));
console.log(`   Prefilled lens notes: ${Object.keys(tpl.suggested).join(', ')}`);

if (!tpl.defaults.toolCategory) {
  note(
    'Template m365-copilot has no explicit toolCategory. It falls back to "AI / ML system" ' +
      'in the seed script but profilePatchToRow may not write it — check what the DB row gets.',
  );
}

/* -- STEP 2: instantiate (what the server action writes) ------------------ */
step('2. "Add to workspace" — what actually lands in the database');

const row = {
  id: 'eval-1',
  org_id: 'org-1',
  name: tpl.name,
  platform: tpl.platform,
  tool_type: tpl.toolType,
  source_template_id: tpl.id,
  ...profilePatchToRow(tpl.defaults),
} as Record<string, unknown>;

console.log('   evaluations row:');
for (const [k, v] of Object.entries(row)) {
  if (v !== undefined) console.log(`     ${k.padEnd(22)} = ${JSON.stringify(v)}`);
}

const profile = rowToProfile(row as never);
console.log(`\n   → parsed back as Profile:`);
console.log(`     category      = ${profile.toolCategory}`);
console.log(`     type          = ${profile.toolType}`);
console.log(`     environment   = ${profile.environment}`);
console.log(`     classification= ${profile.dataClassification}`);
console.log(`     selfHosted    = ${profile.selfHosted}`);
console.log(`     dataTypes     = [${profile.dataTypes.join(', ')}]`);

if (profile.dataTypes.length === 0) {
  note(
    'M365 Copilot instantiates with NO data types, despite pii=true and Confidential ' +
      'classification. The data-flow diagram and every privacy artifact will say ' +
      '"No data types recorded" on a tool that reads the whole mailbox.',
  );
}
if (!profile.businessOwner && !profile.technicalOwner) {
  note(
    'No owner fields are prefilled or prompted after instantiating. Every review lens ' +
      'asks who owns this, and the customer has no nudge to fill it in.',
  );
}
if (!profile.useCase) {
  note('Template sets no useCase, so the Business/Product lens starts with nothing to assess.');
}

/* -- STEP 3: scoping ------------------------------------------------------ */
step('3. Which reviews does this customer actually have to do?');

const applicable = TEAM_LENSES.filter((l) => isApplicable(l, profile));
const skipped = TEAM_LENSES.filter((l) => !isApplicable(l, profile));
const required = TEAM_LENSES.filter((l) => isRequired(l, profile));
const escalated = escalatedLensIds(profile);

console.log(`   Applicable : ${applicable.length}/20`);
console.log(`   Required   : ${required.length}  → ${required.map((l) => l.short).join(', ')}`);
console.log(`   Skipped    : ${skipped.length}  → ${skipped.map((l) => l.short).join(', ') || '(none)'}`);
console.log(`   Escalated  : ${[...escalated].map((id) => LENS_BY_ID[id].short).join(', ')}`);

if (required.length === 0) {
  note('No lenses are required for a Pilot-environment Copilot — the customer sees no work to do.');
}

/* -- STEP 4: the customer works the lenses -------------------------------- */
step('4. Customer works through the required lenses');

const map = {} as Record<TeamId, TeamAssessment>;
for (const lens of TEAM_LENSES) map[lens.id] = makeEmptyAssessment(lens.id);

// Seeded starter notes from the template.
for (const [teamId, patch] of Object.entries(tpl.suggested)) {
  map[teamId as TeamId] = { ...map[teamId as TeamId], ...patch };
  const rowed = assessmentPatchToRow({ ...map[teamId as TeamId] });
  if (!rowed) note(`assessmentPatchToRow returned nothing for ${teamId}`);
}
console.log(`   Template pre-seeded ${Object.keys(tpl.suggested).length} lenses with notes.`);

const emptyScore = computeScoreFromMap(profile, TEAM_LENSES, map);
console.log(`   Day 1 (nothing answered): readiness ${emptyScore.readiness}/100, ` +
  `risk ${emptyScore.risk}, recommendation "${emptyScore.recommendation}"`);

// A realistic mid-review state: most controls done, oversharing unresolved.
for (const lens of required) {
  const a = map[lens.id];
  a.score = 4;
  a.decision = 'Approved with Conditions';
  a.owner = 'A. Reviewer';
  lens.requiredControls.forEach((c, i) => {
    if (i % 4 !== 0) a.checkedControls[c.id] = true;
  });
  lens.evidenceRequired.forEach((e, i) => {
    if (i % 3 !== 0) a.checkedEvidence[e.id] = true;
  });
}
const midScore = computeScoreFromMap(profile, TEAM_LENSES, map);
console.log(`   Mid-review: readiness ${midScore.readiness}/100, risk ${midScore.risk}, ` +
  `"${midScore.recommendation}", evidence ${midScore.evidenceCompleteness}%`);

// The real Copilot blocker: Graph oversharing.
const dg = LENS_BY_ID['data-governance'];
const overshare = dg.blockers[0];
map['data-governance'].activeBlockers[overshare.id] = true;
const blockedScore = computeScoreFromMap(profile, TEAM_LENSES, map);
console.log(`   After flagging "${overshare.label}"${overshare.critical ? ' [critical]' : ''}:`);
console.log(`     readiness ${blockedScore.readiness}/100, risk ${blockedScore.risk}, ` +
  `"${blockedScore.recommendation}", blockers ${blockedScore.blockersCount}`);

/* -- STEP 5: workflow ----------------------------------------------------- */
step('5. Where is it in the approval path?');

const stages = makeDefaultWorkflow();
console.log(`   ${stages.length} stages seeded, all "${stages[0].status}".`);
const aiStages = stages.filter((s) => /AI |Agent/.test(s.name));
console.log(`   AI-specific stages present: ${aiStages.map((s) => s.name).join(', ')}`);
const skippedNames = new Set(skipped.map((l) => l.title));
const orphanStages = stages.filter((s) =>
  [...skippedNames].some((t) => t.toLowerCase().includes(s.name.toLowerCase())),
);
if (orphanStages.length) {
  note(
    `Workflow seeds all 25 stages regardless of scope. For this tool, stages ` +
      `${orphanStages.map((s) => s.name).join(', ')} correspond to lenses that were skipped ` +
      `as out of scope — the customer is asked to march through gates that don't apply.`,
  );
} else if (skipped.length > 0) {
  note(
    `Lens scoping skips ${skipped.length} reviews, but makeDefaultWorkflow() still seeds all ` +
      `${stages.length} stages unconditionally. Scope is applied on the lenses page and ignored ` +
      `by the workflow — the two views disagree.`,
  );
}

/* -- STEP 6: outputs ------------------------------------------------------ */
step('6. What the customer walks away with');

const brand = resolveBranding({
  name: 'Northwind Holdings',
  legal_name: 'Northwind Holdings Inc.',
  brand_color: '#2B4C7E',
  confidentiality_label: 'Confidential — Internal Use Only',
  document_footer: '© Northwind Holdings Inc.',
});

const ctx = buildReportContext(
  profile,
  blockedScore,
  (id) => map[id] ?? makeEmptyAssessment(id),
  '2026-07-28T12:00:00.000Z',
  brand,
);

const artifacts = EVIDENCE_ARTIFACTS.map((a) => ({ id: a.id, title: a.title, body: a.build(ctx) }));
console.log(`   Evidence artifacts: ${artifacts.length}`);
const emptyArtifacts = artifacts.filter((a) => a.body.length < 500);
if (emptyArtifacts.length) {
  note(`Thin evidence artifacts (<500 chars): ${emptyArtifacts.map((a) => a.id).join(', ')}`);
}

// Artifacts for lenses this tool skipped are noise in the customer's pack.
const outOfScopeArtifacts = artifacts.filter((a) => {
  const lens = skipped.find((l) => a.title.includes(l.title) || a.id.includes(l.id.split('-')[0]));
  return Boolean(lens);
});
if (outOfScopeArtifacts.length) {
  note(
    `Evidence Factory offers ${outOfScopeArtifacts.length} artifacts for skipped lenses ` +
      `(${outOfScopeArtifacts.map((a) => a.id).join(', ')}). Scope is ignored here too.`,
  );
}

const diagrams = buildDiagrams(ctx, stages);
console.log(`   Diagrams: ${diagrams.map((d) => d.title).join(', ')}`);
const flow = diagrams.find((d) => d.id === 'data-flow')!;
if (flow.svg.includes('No data types recorded')) {
  note('The data-flow diagram for Copilot renders "No data types recorded" — see step 2.');
}

const html = toBrandedHtml(ctx, brand, {
  title: 'Tool Adoption Review',
  producedWith: 'Prepared with Aegis',
  sections: diagrams.map((d) => ({ title: d.title, paragraphs: [d.purpose], html: d.svg })),
});
writeFileSync('/tmp/copilot-review.html', html);
writeFileSync('/tmp/copilot-gonogo.md', toGoNoGoReport(ctx));
console.log(`   Branded document: /tmp/copilot-review.html (${(html.length / 1024).toFixed(0)} KB)`);
console.log(`   Go/no-go pack:    /tmp/copilot-gonogo.md`);

/* -- findings ------------------------------------------------------------- */
step(`FINDINGS (${problems.length})`);
problems.forEach((p, i) => console.log(`\n ${i + 1}. ${p}`));
if (!problems.length) console.log('   none');

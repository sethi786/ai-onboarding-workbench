import 'server-only';
import { structured, prose, type AiResult } from './client';
import {
  INTAKE_SYSTEM,
  LENS_SYSTEM,
  NARRATIVE_SYSTEM,
  QUESTIONNAIRE_SYSTEM,
} from './prompts';
import { TOOL_CATEGORIES } from '@/workbench/types';
import { DATA_CLASSIFICATIONS, DATA_TYPE_OPTIONS, ENVIRONMENTS } from '@/workbench/data/constants';
import type { Profile, TeamAssessment, TeamLens } from '@/workbench/types';
import type { ReportContext } from '@/workbench/export/reportContext';

/**
 * Every place the assistant plugs into the review workflow.
 *
 * Each function returns structured, placeable output rather than prose the UI
 * has to interpret, and each one is separately failable — a workspace with no
 * key, or one AI call that errors, degrades that one affordance and nothing
 * else.
 */

/* ------------------------------------------------------------------ intake */

export interface DraftedIntake {
  name: string;
  platform: string;
  toolCategory: string;
  useCase: string;
  targetUsers: string;
  environment: string;
  dataClassification: string;
  dataTypes: string[];
  agentEnabled: boolean;
  connectorEnabled: boolean;
  ragEnabled: boolean;
  externalVendor: boolean;
  selfHosted: boolean;
  pii: boolean;
  clientData: boolean;
  autonomousActions: boolean;
  /** Fields the description didn't answer — surfaced so the user fills them in. */
  unanswered: string[];
  /** Why the classification and flags were set the way they were. */
  reasoning: string;
}

const INTAKE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Product name only, no vendor suffix.' },
    platform: { type: 'string', description: 'Vendor or platform. Empty string if not stated.' },
    toolCategory: { type: 'string', enum: TOOL_CATEGORIES },
    useCase: { type: 'string', description: 'One or two sentences on what it will be used for.' },
    targetUsers: { type: 'string', description: 'Who will use it. Empty string if not stated.' },
    environment: { type: 'string', enum: ENVIRONMENTS },
    dataClassification: { type: 'string', enum: DATA_CLASSIFICATIONS },
    dataTypes: { type: 'array', items: { type: 'string', enum: DATA_TYPE_OPTIONS } },
    agentEnabled: { type: 'boolean', description: 'Acts autonomously on a user’s behalf.' },
    connectorEnabled: { type: 'boolean', description: 'Integrates with other business systems.' },
    ragEnabled: { type: 'boolean', description: 'Indexes or retrieves your content to answer.' },
    externalVendor: { type: 'boolean', description: 'Supplied by a third party.' },
    selfHosted: { type: 'boolean', description: 'Runs on infrastructure you operate.' },
    pii: { type: 'boolean' },
    clientData: { type: 'boolean' },
    autonomousActions: { type: 'boolean', description: 'Takes actions without per-action approval.' },
    unanswered: {
      type: 'array',
      items: { type: 'string' },
      description: 'Short labels for fields the description did not establish.',
    },
    reasoning: { type: 'string', description: 'Two or three sentences a reviewer can check.' },
  },
  required: [
    'name', 'platform', 'toolCategory', 'useCase', 'targetUsers', 'environment',
    'dataClassification', 'dataTypes', 'agentEnabled', 'connectorEnabled', 'ragEnabled',
    'externalVendor', 'selfHosted', 'pii', 'clientData', 'autonomousActions',
    'unanswered', 'reasoning',
  ],
  additionalProperties: false,
} as const;

/**
 * Turn a pasted description into a filled intake form.
 *
 * This is the step that stalls adoptions: somebody has to translate "we want to
 * use this thing" into twenty governance fields, and most requesters don't know
 * what half of them mean. Reading a vendor page and proposing the answers —
 * with its reasoning attached, and an explicit list of what it couldn't
 * determine — turns a blocking form into a review.
 */
export async function draftIntake(description: string): Promise<AiResult<DraftedIntake>> {
  return structured<DraftedIntake>({
    system: INTAKE_SYSTEM,
    schema: INTAKE_SCHEMA as unknown as Record<string, unknown>,
    prompt: `Extract a tool intake record from this description.

<description>
${description}
</description>

Set a capability flag to true only where the description gives positive evidence for it.
List every field you could not establish in "unanswered".`,
  });
}

/* -------------------------------------------------------------------- lens */

export interface DraftedLensAnswer {
  /** Assessment narrative for this team's remit. */
  notes: string;
  residualRisk: string;
  /** Control ids the intake data suggests are already satisfied. */
  likelySatisfiedControlIds: string[];
  /** Control ids that clearly need work, with the reason. */
  openControls: { id: string; why: string }[];
  /** Concrete questions to put to the vendor or the requesting team. */
  questionsToAsk: string[];
  /** Evidence to request, named specifically enough to go in an email. */
  evidenceToRequest: string[];
}

const LENS_SCHEMA = {
  type: 'object',
  properties: {
    notes: { type: 'string', description: 'Assessment narrative, 3-6 sentences.' },
    residualRisk: { type: 'string', description: 'What risk remains after the stated controls.' },
    likelySatisfiedControlIds: { type: 'array', items: { type: 'string' } },
    openControls: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, why: { type: 'string' } },
        required: ['id', 'why'],
        additionalProperties: false,
      },
    },
    questionsToAsk: { type: 'array', items: { type: 'string' } },
    evidenceToRequest: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'notes', 'residualRisk', 'likelySatisfiedControlIds', 'openControls',
    'questionsToAsk', 'evidenceToRequest',
  ],
  additionalProperties: false,
} as const;

export async function draftLensAnswer(
  lens: TeamLens,
  profile: Profile,
  assessment: TeamAssessment,
): Promise<AiResult<DraftedLensAnswer>> {
  return structured<DraftedLensAnswer>({
    system: LENS_SYSTEM,
    schema: LENS_SCHEMA as unknown as Record<string, unknown>,
    prompt: `Draft the ${lens.title} section of this review.

<review_team>
Team: ${lens.title}
Remit: ${lens.reviewPurpose}
Scope: ${lens.scope.join('; ')}
Pass criteria: ${lens.passCriteria.join('; ')}
</review_team>

<required_controls>
${lens.requiredControls.map((c) => `${c.id}: ${c.label}${c.critical ? ' [critical]' : ''}`).join('\n')}
</required_controls>

<expected_evidence>
${lens.evidenceRequired.map((e) => `${e.id}: ${e.label}`).join('\n')}
</expected_evidence>

<tool_under_review>
${describeProfile(profile)}
</tool_under_review>

<already_recorded>
Controls the team has already ticked: ${idsOf(assessment.checkedControls) || 'none'}
Evidence already attached: ${idsOf(assessment.checkedEvidence) || 'none'}
Reviewer notes so far: ${assessment.notes || 'none'}
</already_recorded>

Use only control and evidence ids from the lists above. Do not mark a control satisfied because it
is plausible — only where the intake data supports it.`,
  });
}

/* --------------------------------------------------------------- narrative */

export async function draftExecutiveSummary(ctx: ReportContext): Promise<AiResult<string>> {
  return prose({
    system: NARRATIVE_SYSTEM,
    maxTokens: 2000,
    prompt: `Write the executive summary for this review pack.

<tool_under_review>
${describeProfile(ctx.profile)}
</tool_under_review>

<assessment_result>
Recommendation: ${ctx.score.recommendation}
Overall readiness: ${ctx.score.readiness}/100
Overall risk: ${ctx.score.risk}
Evidence completeness: ${ctx.score.evidenceCompleteness}%
Active blockers: ${ctx.score.blockersCount}
Reviews signed off: ${ctx.score.teamsSignedOff} of ${ctx.score.requiredTeams}
Reviews not yet started: ${ctx.score.teamsNotStarted} of ${ctx.score.requiredTeams}${
      ctx.score.teamsNotStarted > 0
        ? ' (the readiness figure covers only the reviews that have been done — do not describe this tool as assessed)'
        : ''
    }
</assessment_result>

<team_status>
${ctx.teams
  .filter((t) => t.required)
  .map(
    (t) =>
      `${t.lens.title}: ${t.normalized}% ready, decision "${t.assessment.decision}"` +
      (t.activeBlockerLabels.length ? `, blockers: ${t.activeBlockerLabels.join('; ')}` : '') +
      (t.missingEvidence.length ? `, missing evidence: ${t.missingEvidence.join('; ')}` : ''),
  )
  .join('\n')}
</team_status>

Four to six short paragraphs. No heading, no bullet list, no preamble — start with the
recommendation and why.`,
  });
}

/* ------------------------------------------------------------- discovery */

export interface ClassifiedTool {
  raw: string;
  name: string;
  vendor: string;
  toolCategory: string;
  ai: boolean;
  /** What it's for, in a few words — enough to decide whether to review it. */
  purpose: string;
}

const DISCOVERY_SCHEMA = {
  type: 'object',
  properties: {
    tools: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          raw: { type: 'string', description: 'The input line this came from, verbatim.' },
          name: { type: 'string' },
          vendor: { type: 'string', description: 'Empty string if not identifiable.' },
          toolCategory: { type: 'string', enum: TOOL_CATEGORIES },
          ai: { type: 'boolean', description: 'True only if the core function is AI.' },
          purpose: { type: 'string' },
        },
        required: ['raw', 'name', 'vendor', 'toolCategory', 'ai', 'purpose'],
        additionalProperties: false,
      },
    },
  },
  required: ['tools'],
  additionalProperties: false,
} as const;

/**
 * Identify the lines deterministic matching couldn't place.
 *
 * Only ever called with the leftovers — the catalogue handles everything it
 * recognises for free, and this fills the tail. Told explicitly not to invent
 * a vendor, because a fabricated vendor name on an inventory is worse than an
 * honest blank.
 */
export async function classifyUnknownTools(lines: string[]): Promise<AiResult<{ tools: ClassifiedTool[] }>> {
  return structured<{ tools: ClassifiedTool[] }>({
    system: INTAKE_SYSTEM,
    schema: DISCOVERY_SCHEMA as unknown as Record<string, unknown>,
    prompt: `These lines came from a software inventory — an SSO application list, an expense
export, or a browser extension dump. Identify what each one is.

<lines>
${lines.map((l) => `- ${l}`).join('\n')}
</lines>

Return one entry per line you can identify, carrying the original line in "raw". Skip lines that
are clearly not software. Leave "vendor" empty rather than guessing, and set "ai" true only where
the tool's core function is AI, not merely where it has an AI feature.`,
  });
}

/* ----------------------------------------------------------- questionnaire */

export interface DraftedAnswer {
  answer: string;
  /** What the assessment does not cover, stated rather than papered over. */
  gaps: string[];
  confidence: 'supported by the assessment' | 'partially supported' | 'not covered';
}

const ANSWER_SCHEMA = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
    gaps: { type: 'array', items: { type: 'string' } },
    confidence: {
      type: 'string',
      enum: ['supported by the assessment', 'partially supported', 'not covered'],
    },
  },
  required: ['answer', 'gaps', 'confidence'],
  additionalProperties: false,
} as const;

/**
 * Answer a reviewer or customer question from the assessment.
 *
 * The confidence field is the point: a questionnaire response that reads as
 * authoritative when the underlying assessment doesn't support it is a
 * liability, so the draft carries its own evidential standing.
 */
export async function answerFromAssessment(
  ctx: ReportContext,
  question: string,
): Promise<AiResult<DraftedAnswer>> {
  return structured<DraftedAnswer>({
    system: QUESTIONNAIRE_SYSTEM,
    schema: ANSWER_SCHEMA as unknown as Record<string, unknown>,
    prompt: `Answer this question using only the recorded assessment below.

<question>
${question}
</question>

<tool_under_review>
${describeProfile(ctx.profile)}
</tool_under_review>

<assessment>
Recommendation: ${ctx.score.recommendation} · Readiness ${ctx.score.readiness}/100 · Risk ${ctx.score.risk}

${ctx.teams
  .filter((t) => t.required)
  .map(
    (t) =>
      `## ${t.lens.title} (${t.normalized}% ready, ${t.assessment.decision})\n` +
      `Controls complete: ${t.controlsComplete}/${t.controlsTotal}. ` +
      `Evidence: ${t.evidenceComplete}/${t.evidenceTotal}.` +
      (t.missingEvidence.length ? `\nMissing: ${t.missingEvidence.join('; ')}` : '') +
      (t.activeBlockerLabels.length ? `\nBlockers: ${t.activeBlockerLabels.join('; ')}` : '') +
      (t.assessment.notes ? `\nReviewer notes: ${t.assessment.notes}` : ''),
  )
  .join('\n\n')}
</assessment>`,
  });
}

/* ----------------------------------------------------------------- helpers */

function idsOf(record: Record<string, boolean>): string {
  return Object.entries(record)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(', ');
}

function describeProfile(p: Profile): string {
  const flags = [
    p.agentEnabled && 'acts as an agent',
    p.connectorEnabled && 'connects to other business systems',
    p.ragEnabled && 'indexes or retrieves organizational content',
    p.autonomousActions && 'takes actions without per-action approval',
    p.externalVendor && 'supplied by a third-party vendor',
    p.selfHosted && 'runs on infrastructure the organization operates',
    p.pii && 'handles personal data',
    p.clientData && 'handles client data',
  ].filter(Boolean) as string[];

  return [
    `Name: ${p.name}`,
    `Vendor / platform: ${p.platform || 'not recorded'}`,
    `Category: ${p.toolCategory} (${p.toolType})`,
    `Use case: ${p.useCase || 'not recorded'}`,
    `Target users: ${p.targetUsers || 'not recorded'}`,
    `Business owner: ${p.businessOwner || 'not recorded'}`,
    `Technical owner: ${p.technicalOwner || 'not recorded'}`,
    `Environment: ${p.environment}`,
    `Data classification: ${p.dataClassification}`,
    `Data types: ${p.dataTypes.join(', ') || 'not recorded'}`,
    `Model: ${p.model || 'n/a'}`,
    `Characteristics: ${flags.join('; ') || 'none recorded'}`,
  ].join('\n');
}

import { TEAM_LENSES } from '@/workbench/data/teamLenses';
import {
  isRequired,
  reviewDepth,
  baseDepth,
  controlsAtDepth,
  evidenceAtDepth,
  explainScope,
  type ScopeExplanation,
} from '@/workbench/engine/reviewIntensity';
import { computeRisk } from '@/workbench/engine/scoring';
import { FRAMEWORKS } from '@/workbench/data/frameworks';
import { discoverFromText, provisionalProfile } from '@/workbench/engine/discovery';
import type { Profile, ReviewDepth, RiskLevel, TeamId } from '@/workbench/types';

/**
 * The scoping answer, computed from a handful of facts about a tool.
 *
 * This is the same engine the product runs, packaged so it can be used without
 * an account. Scoping is the part of the work that pays off before anyone signs
 * up: knowing that eleven of twenty reviews don't apply, and being able to say
 * why, is useful on its own — and it's the claim most likely to be disbelieved,
 * so it should be the easiest one to check.
 *
 * Pure and synchronous, so it runs in the browser with no key and no request.
 */

export interface ScopedReview {
  id: TeamId;
  title: string;
  short: string;
  purpose: string;
  depth: ReviewDepth;
  controls: number;
  criticalControls: number;
  evidence: number;
  explanation: ScopeExplanation;
}

export interface ScopePreview {
  profile: Profile;
  /** Whether the tool name matched something we hold real defaults for. */
  matched: boolean;
  matchedName: string;
  depth: ReviewDepth;
  risk: RiskLevel;
  required: ScopedReview[];
  skipped: ScopedReview[];
  totalLenses: number;
  /** Controls actually asked, at the depths assigned. */
  controlsAsked: number;
  /** Controls if every lens ran at full depth — the burden being avoided. */
  controlsIfUnscoped: number;
  evidenceAsked: number;
  evidenceIfUnscoped: number;
  frameworks: { id: string; name: string; clauses: number }[];
}

export interface ScopeAnswers {
  environment: Profile['environment'];
  dataClassification: Profile['dataClassification'];
  pii: boolean;
  clientData: boolean;
  connectorEnabled: boolean;
  autonomousActions: boolean;
  selfHosted: boolean;
}

export const SCOPE_DEFAULTS: ScopeAnswers = {
  environment: 'Pilot',
  dataClassification: 'Internal',
  pii: false,
  clientData: false,
  connectorEnabled: false,
  autonomousActions: false,
  selfHosted: false,
};

/**
 * Build a profile from a typed tool name plus the visitor's answers.
 *
 * The name goes through the same matcher the discovery feature uses, so a
 * recognised tool inherits its real template defaults (category, model,
 * retrieval, vendor) and an unrecognised one falls back to the visitor's
 * answers alone rather than to invented facts.
 */
export function profileFromAnswers(toolName: string, answers: ScopeAnswers): Profile {
  const [discovered] = discoverFromText(toolName.trim() || 'Unnamed tool');
  const base = provisionalProfile(
    discovered ?? {
      raw: toolName,
      name: toolName || 'Unnamed tool',
      vendor: '',
      category: 'SaaS application',
      source: 'unmatched',
      ai: false,
      shadowAi: false,
    },
  );

  return {
    ...base,
    // The visitor's own answers always win over template defaults — they know
    // their deployment and the template only knows the product.
    environment: answers.environment,
    dataClassification: answers.dataClassification,
    pii: answers.pii,
    clientData: answers.clientData,
    connectorEnabled: answers.connectorEnabled,
    autonomousActions: answers.autonomousActions,
    agentEnabled: base.agentEnabled || answers.autonomousActions,
    selfHosted: answers.selfHosted,
    externalVendor: !answers.selfHosted,
  };
}

export function scopePreview(toolName: string, answers: ScopeAnswers): ScopePreview {
  const [discovered] = discoverFromText(toolName.trim() || 'Unnamed tool');
  const matched = discovered !== undefined && discovered.source !== 'unmatched';
  const profile = profileFromAnswers(toolName, answers);

  const rows: ScopedReview[] = TEAM_LENSES.map((lens) => {
    const depth = reviewDepth(lens, profile);
    const controls = controlsAtDepth(lens, depth);
    return {
      id: lens.id,
      title: lens.title,
      short: lens.short,
      purpose: lens.reviewPurpose,
      depth,
      controls: controls.length,
      criticalControls: controls.filter((c) => c.critical).length,
      evidence: evidenceAtDepth(lens, depth).length,
      explanation: explainScope(lens, profile),
    };
  });

  const required = rows.filter((r) => r.explanation.status === 'required');
  const skipped = rows.filter((r) => r.explanation.status !== 'required');

  const requiredIds = new Set(required.map((r) => r.id));
  const frameworks = FRAMEWORKS.map((f) => ({
    id: f.id,
    name: f.name,
    clauses: f.clauses.filter((c) => c.lenses.some((l) => requiredIds.has(l))).length,
  })).filter((f) => f.clauses > 0);

  return {
    profile,
    matched,
    matchedName: discovered?.name ?? toolName,
    depth: baseDepth(profile),
    risk: computeRisk(profile, false),
    required,
    skipped,
    totalLenses: TEAM_LENSES.length,
    controlsAsked: required.reduce((n, r) => n + r.controls, 0),
    controlsIfUnscoped: TEAM_LENSES.reduce((n, l) => n + l.requiredControls.length, 0),
    evidenceAsked: required.reduce((n, r) => n + r.evidence, 0),
    evidenceIfUnscoped: TEAM_LENSES.reduce((n, l) => n + l.evidenceRequired.length, 0),
    frameworks,
  };
}

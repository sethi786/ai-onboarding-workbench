import type {
  ControlItem,
  EvidenceReq,
  Profile,
  ReviewDepth,
  TeamLens,
  TeamId,
} from '../types';

/**
 * Decides how much review a tool actually owes, across three independent axes.
 *
 * 1. APPLICABILITY — does this team have any standing here? An AI Engineering
 *    review means nothing for a third-party CRM; Secure SDLC means nothing for
 *    software you neither build nor host. An inapplicable lens is never
 *    required, whatever else is true.
 *
 * 2. REQUIREMENT — must it be done for *this* tool? Only three lenses are
 *    unconditional (business case, security, and the go/no-go call). The rest
 *    are summoned by a real trigger: personal data summons privacy, connectors
 *    summon identity, hosting it yourself summons platform review.
 *
 * 3. DEPTH — how hard does that team look? Screening asks only the
 *    make-or-break controls and collects no documents; Standard is the full
 *    control set; Deep adds the artifacts that cost weeks (pen tests, bias
 *    studies, DR rehearsals).
 *
 * The three together are the difference between a process people follow and one
 * they bypass. Collapsing them — requiring every lens at full depth for
 * everything — is technically thorough and practically useless: a sandbox trial
 * of a note-taking app would owe more work than most teams will ever do.
 */
export function isApplicable(lens: TeamLens, profile: Profile): boolean {
  return lens.appliesWhen ? lens.appliesWhen(profile) : true;
}

export function isRequired(lens: TeamLens, profile: Profile): boolean {
  // Scope first: an inapplicable lens is never required, including in
  // Production and regardless of `alwaysRequired`.
  if (!isApplicable(lens, profile)) return false;
  // Production no longer summons every lens. It raises *depth* through
  // `baseDepth`, and the lenses that genuinely care about live operation say so
  // in their own `requiredWhen`. Blanket-requiring everything was how a vendor
  // note-taking app ended up owing an enterprise architecture review.
  if (lens.alwaysRequired) return true;
  if (lens.requiredWhen) return lens.requiredWhen(profile);
  return false;
}

export function applicableLensIds(lenses: TeamLens[], profile: Profile): TeamId[] {
  return lenses.filter((l) => isApplicable(l, profile)).map((l) => l.id);
}

export function requiredLensIds(lenses: TeamLens[], profile: Profile): TeamId[] {
  return lenses.filter((l) => isRequired(l, profile)).map((l) => l.id);
}

/**
 * Facts that make specific teams look one level harder.
 *
 * `label` reads after "because …" and lives here rather than in a parallel
 * table, so the explanation a reviewer sees can never describe a rule that
 * isn't the one that fired.
 */
const ESCALATION: { when: (p: Profile) => boolean; teams: TeamId[]; label: string }[] = [
  { when: (p) => p.pii, teams: ['privacy-pia', 'data-governance'], label: 'personal data is in scope' },
  { when: (p) => p.clientData, teams: ['privacy-pia', 'legal', 'qrm-risk', 'data-governance'], label: 'client data is in scope' },
  { when: (p) => p.autonomousActions, teams: ['security-sar', 'qrm-risk', 'agent-governance'], label: 'it acts without per-action approval' },
  { when: (p) => p.externalVendor, teams: ['vendor-risk', 'legal'], label: 'it comes from an external vendor' },
  { when: (p) => p.connectorEnabled, teams: ['connector-governance', 'security-sar'], label: 'it reaches your other systems' },
  { when: (p) => p.agentEnabled, teams: ['agent-governance', 'security-sar'], label: 'it runs as an agent' },
  // You own the runtime: hardening, patching, and supply chain are on you.
  { when: (p) => p.selfHosted, teams: ['secure-sdlc', 'platform-cloud', 'security-sar'], label: 'you own the runtime' },
];

export function escalatedLensIds(profile: Profile): Set<TeamId> {
  const set = new Set<TeamId>();
  for (const rule of ESCALATION) {
    if (rule.when(profile)) rule.teams.forEach((t) => set.add(t));
  }
  return set;
}

/* ------------------------------------------------------------------ depth */

/**
 * How much scrutiny this tool warrants overall, on a 0-8ish scale.
 *
 * Deliberately the same signals `computeRisk` uses, because the two answer
 * versions of one question: risk is "how bad if this goes wrong", depth is
 * "how hard should we look before finding out".
 */
function exposure(profile: Profile): number {
  let n = 0;
  if (profile.dataClassification === 'Restricted') n += 3;
  else if (profile.dataClassification === 'Confidential') n += 2;
  else if (profile.dataClassification === 'Internal') n += 1;

  if (profile.pii) n += 1;
  if (profile.clientData) n += 2;
  if (profile.autonomousActions) n += 2;
  if (profile.agentEnabled) n += 1;
  if (profile.connectorEnabled) n += 1;
  if (profile.ragEnabled) n += 1;

  if (profile.environment === 'Production') n += 3;
  else if (profile.environment === 'UAT') n += 2;
  else if (profile.environment === 'Pilot') n += 1;

  return n;
}

/**
 * The depth this profile earns before any per-lens escalation.
 *
 * The Standard threshold sits at 2 so that a single meaningful fact tips a tool
 * out of screening: a real pilot on internal data, or confidential data even in
 * a sandbox. Screening is for tools that genuinely have nothing at stake yet.
 */
export function baseDepth(profile: Profile): ReviewDepth {
  const n = exposure(profile);
  if (n >= 7) return 'Deep';
  if (n >= 2) return 'Standard';
  return 'Screening';
}

const ORDER: ReviewDepth[] = ['Screening', 'Standard', 'Deep'];

function deeper(depth: ReviewDepth, steps = 1): ReviewDepth {
  return ORDER[Math.min(ORDER.length - 1, ORDER.indexOf(depth) + steps)];
}

/**
 * Depth for one lens. Starts from the profile's base depth, then goes one level
 * deeper for the lenses this profile specifically escalates — so a tool holding
 * personal data gets a deep privacy review without dragging finance review down
 * the same hole.
 */
export function reviewDepth(lens: TeamLens, profile: Profile): ReviewDepth {
  const base = baseDepth(profile);
  return escalatedLensIds(profile).has(lens.id) ? deeper(base) : base;
}

/**
 * The controls actually asked at a given depth.
 *
 * Screening asks only the critical controls. That isn't an arbitrary cut: the
 * lens authors already marked the make-or-break items, and those are exactly
 * the questions worth asking before deciding whether to look harder.
 */
export function controlsAtDepth(lens: TeamLens, depth: ReviewDepth): ControlItem[] {
  if (depth === 'Screening') return lens.requiredControls.filter((c) => c.critical);
  return lens.requiredControls;
}

/**
 * The evidence actually collected at a given depth.
 *
 * Screening collects none — it is a questionnaire pass, not a document hunt.
 * Deep adds the expensive artifacts (pen tests, bias studies, DR rehearsals).
 */
export function evidenceAtDepth(lens: TeamLens, depth: ReviewDepth): EvidenceReq[] {
  if (depth === 'Screening') return [];
  if (depth === 'Deep') return lens.evidenceRequired;
  return lens.evidenceRequired.filter((e) => !e.deep);
}

/* ------------------------------------------------------------ explanation */

/**
 * Single-fact changes to a profile, used to work out what would bring a review
 * into scope.
 *
 * Rather than describing each lens's trigger in prose that drifts away from the
 * predicate, this asks the predicate itself: flip one fact, see whether the
 * answer changes. The explanation is therefore derived from the same code that
 * makes the decision and cannot contradict it — which matters, because "why
 * didn't privacy review this?" is the first question anyone asks of a tool that
 * decides what to skip.
 */
interface Probe {
  /** Reads after "would apply if …". */
  label: string;
  /** Reads after "required because …". */
  present: string;
  on: (p: Profile) => Profile;
  off: (p: Profile) => Profile;
  /** Whether the fact is currently true of this profile. */
  holds: (p: Profile) => boolean;
}

const PROBES: Probe[] = [
  {
    label: 'it held personal data',
    present: 'it holds personal data',
    on: (p) => ({ ...p, pii: true }),
    off: (p) => ({ ...p, pii: false }),
    holds: (p) => p.pii,
  },
  {
    label: 'it held client data',
    present: 'it holds client data',
    on: (p) => ({ ...p, clientData: true }),
    off: (p) => ({ ...p, clientData: false }),
    holds: (p) => p.clientData,
  },
  {
    label: 'it connected to your other systems',
    present: 'it connects to your other systems',
    on: (p) => ({ ...p, connectorEnabled: true }),
    off: (p) => ({ ...p, connectorEnabled: false }),
    holds: (p) => p.connectorEnabled,
  },
  {
    label: 'it searched your own content',
    present: 'it searches your own content',
    on: (p) => ({ ...p, ragEnabled: true }),
    off: (p) => ({ ...p, ragEnabled: false }),
    holds: (p) => p.ragEnabled,
  },
  {
    label: 'it took actions on its own',
    present: 'it takes actions on its own',
    on: (p) => ({ ...p, agentEnabled: true, autonomousActions: true }),
    off: (p) => ({ ...p, agentEnabled: false, autonomousActions: false }),
    holds: (p) => p.agentEnabled || p.autonomousActions,
  },
  {
    label: 'you hosted or built it yourself',
    present: 'you host or build it yourself',
    on: (p) => ({ ...p, selfHosted: true }),
    off: (p) => ({ ...p, selfHosted: false }),
    holds: (p) => p.selfHosted,
  },
  {
    label: 'it were an AI system',
    present: 'it is an AI system',
    on: (p) => ({ ...p, toolCategory: 'AI / ML system' }),
    off: (p) => ({ ...p, toolCategory: 'SaaS application' }),
    holds: (p) => p.toolCategory === 'AI / ML system',
  },
  {
    label: 'it came from an external vendor',
    present: 'it comes from an external vendor',
    on: (p) => ({ ...p, externalVendor: true }),
    off: (p) => ({ ...p, externalVendor: false }),
    holds: (p) => p.externalVendor,
  },
  {
    label: 'it ran in production',
    present: 'it runs in production',
    on: (p) => ({ ...p, environment: 'Production' }),
    off: (p) => ({ ...p, environment: 'Sandbox' }),
    holds: (p) => p.environment === 'Production',
  },
  {
    label: 'it handled confidential data',
    present: 'it handles confidential data',
    on: (p) => ({ ...p, dataClassification: 'Confidential' }),
    off: (p) => ({ ...p, dataClassification: 'Public' }),
    holds: (p) => p.dataClassification === 'Confidential' || p.dataClassification === 'Restricted',
  },
];

/**
 * Which facts are actually holding this review in scope.
 *
 * Found by removing one fact at a time and seeing whether the requirement
 * survives — so the answer comes from the predicate rather than from prose
 * written alongside it. An empty result means nothing specific summoned it: the
 * review is unconditional.
 */
export function requirementDrivers(lens: TeamLens, profile: Profile): string[] {
  if (!isRequired(lens, profile)) return [];
  return PROBES.filter((probe) => probe.holds(profile) && !isRequired(lens, probe.off(profile))).map(
    (probe) => probe.present,
  );
}

/** The escalation rule that applies to this lens, if any. */
function escalationFor(lens: TeamLens, profile: Profile) {
  return ESCALATION.find((rule) => rule.when(profile) && rule.teams.includes(lens.id));
}

/**
 * Do two phrasings refer to the same underlying fact?
 *
 * The requirement driver and the escalation label are written for different
 * sentence positions ("it holds personal data" / "personal data is in scope"),
 * so they are compared on their distinctive words rather than as strings.
 */
function sameFact(driver: string, escalationLabel: string): boolean {
  const KEYS = ['personal data', 'client data', 'external vendor', 'other systems', 'agent', 'runtime', 'per-action'];
  return KEYS.some((k) => driver.includes(k) && escalationLabel.includes(k));
}

export type ScopeStatus = 'required' | 'not-applicable' | 'not-triggered';

export interface ScopeExplanation {
  status: ScopeStatus;
  /** Plain-language reason, safe to show a reviewer. */
  reason: string;
  /** Single facts that would bring this review into scope. Empty when required. */
  wouldApplyIf: string[];
}

/**
 * Why a review is in scope, or what would put it there.
 *
 * A tool that quietly drops fourteen of twenty reviews has to be able to defend
 * each omission, or the first sceptical reviewer discards the whole result.
 */
export function explainScope(lens: TeamLens, profile: Profile): ScopeExplanation {
  if (isRequired(lens, profile)) {
    const drivers = requirementDrivers(lens, profile);
    const why = drivers.length
      ? `Required because ${drivers.slice(0, 2).join(' and ')}.`
      : 'Required for every tool — this is one of the reviews nothing skips.';

    // When the same fact both summons the review and deepens it, say it once.
    // Two sentences making the same point read as padding, and padding is how
    // a reader learns to stop reading the explanations.
    const depth = depthRationale(lens, profile);
    const escalation = escalationFor(lens, profile);
    const alreadySaid =
      escalation !== undefined && drivers.some((d) => sameFact(d, escalation.label));
    const depthClause = alreadySaid
      ? `${reviewDepth(lens, profile)} depth, one level deeper than the rest of this review.`
      : depth;

    return { status: 'required', reason: `${why} ${depthClause}`, wouldApplyIf: [] };
  }

  const wouldApplyIf: string[] = [];
  for (const probe of PROBES) {
    if (!probe.holds(profile) && isRequired(lens, probe.on(profile))) wouldApplyIf.push(probe.label);
  }

  if (!isApplicable(lens, profile)) {
    return {
      status: 'not-applicable',
      reason: `This review has no standing over a tool like ${profile.name || 'this one'} — its remit doesn’t reach it.`,
      wouldApplyIf,
    };
  }
  return {
    status: 'not-triggered',
    reason: 'In this team’s remit, but nothing about this tool triggers a review.',
    wouldApplyIf,
  };
}

/**
 * One line explaining a lens's depth, for the reviewer who asks why.
 *
 * An escalated lens names the rule that escalated *it* rather than restating
 * the tool's overall exposure — otherwise every section of the report carries
 * the same sentence and the explanation reads as boilerplate, which is worse
 * than no explanation because it looks like one.
 */
export function depthRationale(lens: TeamLens, profile: Profile): string {
  const depth = reviewDepth(lens, profile);

  if (depth === 'Screening') {
    return 'Screening depth: low exposure, so only the make-or-break controls are asked. Raise the environment or data classification and this deepens automatically.';
  }

  const escalation = ESCALATION.find(
    (rule) => rule.when(profile) && rule.teams.includes(lens.id),
  );
  if (escalation) {
    return `${depth} depth — one level deeper than the rest of this review, because ${escalation.label}.`;
  }

  const exposureDrivers = [
    profile.environment === 'Production' && 'production',
    profile.environment === 'UAT' && 'UAT',
    profile.dataClassification === 'Restricted' && 'restricted data',
    profile.dataClassification === 'Confidential' && 'confidential data',
  ].filter(Boolean) as string[];

  return exposureDrivers.length
    ? `${depth} depth, set by the tool's overall exposure (${exposureDrivers.join(', ')}).`
    : `${depth} depth.`;
}

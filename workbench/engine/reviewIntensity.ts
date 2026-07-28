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

const ESCALATION: { when: (p: Profile) => boolean; teams: TeamId[] }[] = [
  { when: (p) => p.pii, teams: ['privacy-pia', 'data-governance'] },
  { when: (p) => p.clientData, teams: ['privacy-pia', 'legal', 'qrm-risk', 'data-governance'] },
  { when: (p) => p.autonomousActions, teams: ['security-sar', 'qrm-risk', 'agent-governance'] },
  { when: (p) => p.externalVendor, teams: ['vendor-risk', 'legal'] },
  { when: (p) => p.connectorEnabled, teams: ['connector-governance', 'security-sar'] },
  { when: (p) => p.agentEnabled, teams: ['agent-governance', 'security-sar'] },
  // You own the runtime: hardening, patching, and supply chain are on you.
  { when: (p) => p.selfHosted, teams: ['secure-sdlc', 'platform-cloud', 'security-sar'] },
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

/** One line explaining a lens's depth, for the reviewer who asks why. */
export function depthRationale(lens: TeamLens, profile: Profile): string {
  const depth = reviewDepth(lens, profile);
  const escalated = escalatedLensIds(profile).has(lens.id);
  const drivers = [
    profile.environment === 'Production' && 'runs in production',
    profile.dataClassification === 'Restricted' && 'handles restricted data',
    profile.dataClassification === 'Confidential' && 'handles confidential data',
    profile.pii && 'holds personal data',
    profile.clientData && 'holds client data',
    profile.autonomousActions && 'acts without per-action approval',
    profile.connectorEnabled && 'reaches other systems',
  ].filter(Boolean) as string[];

  if (depth === 'Screening') {
    return 'Screening review: low exposure, so only the make-or-break controls are asked. Raise the environment or data classification and this deepens automatically.';
  }
  const because = drivers.length ? ` because it ${drivers.slice(0, 2).join(' and ')}` : '';
  return escalated
    ? `${depth} review: this lens is escalated for this tool${because}.`
    : `${depth} review${because}.`;
}

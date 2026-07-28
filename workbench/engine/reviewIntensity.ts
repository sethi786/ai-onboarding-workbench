import type { Profile, TeamLens, TeamId } from '../types';

/**
 * Determines which lenses apply to a profile, which are required, and which are
 * escalated (higher scrutiny).
 *
 * Scope is decided before intensity:
 *  - applicability       -> a lens irrelevant to this kind of tool is never
 *                           required (AI Engineering for a third-party CRM,
 *                           Secure SDLC for software you neither build nor host)
 * Then intensity:
 *  - production          -> all applicable lenses required
 *  - agent / autonomous  -> Agent Governance required
 *  - connector           -> Connector Governance required
 *  - external vendor     -> Vendor Risk required
 *  - PII / client data   -> Privacy, Legal, Data Governance escalated
 *  - autonomous actions  -> Security, QRM, Agent Governance escalated
 *  - self-hosted         -> Secure SDLC, Platform, Security escalated
 */
export function isApplicable(lens: TeamLens, profile: Profile): boolean {
  return lens.appliesWhen ? lens.appliesWhen(profile) : true;
}

export function isRequired(lens: TeamLens, profile: Profile): boolean {
  // Scope first: an inapplicable lens is never required, including in
  // Production and regardless of `alwaysRequired`.
  if (!isApplicable(lens, profile)) return false;
  if (profile.environment === 'Production') return true;
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

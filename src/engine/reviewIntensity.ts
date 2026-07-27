import type { Profile, TeamLens, TeamId } from '../types';

/**
 * Determines which lenses are required for a profile and which are escalated
 * (higher scrutiny). Implements the conditional review-intensity rules:
 *  - agent / autonomous  -> Agent Governance required
 *  - connector           -> Connector Governance required
 *  - external vendor     -> Vendor Risk required
 *  - PII / client data   -> Privacy, Legal, Data Governance escalated
 *  - autonomous actions  -> Security, QRM, Agent Governance escalated
 *  - production          -> all lenses required
 */
export function isRequired(lens: TeamLens, profile: Profile): boolean {
  if (profile.environment === 'Production') return true;
  if (lens.alwaysRequired) return true;
  if (lens.requiredWhen) return lens.requiredWhen(profile);
  return false;
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
];

export function escalatedLensIds(profile: Profile): Set<TeamId> {
  const set = new Set<TeamId>();
  for (const rule of ESCALATION) {
    if (rule.when(profile)) rule.teams.forEach((t) => set.add(t));
  }
  return set;
}

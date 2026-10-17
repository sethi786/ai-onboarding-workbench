import { TEAM_LENSES, LENS_BY_ID } from '../../data/teamLenses';
import { makeEmptyAssessment } from '../../types';
import type { Profile, TeamAssessment, TeamId } from '../../types';
export function baseProfile(over: Partial<Profile> = {}): Profile {
  return {
    id: 'p1',
    name: 'Test',
    platform: 'Internal AI App',
    toolCategory: 'AI / ML system',
    toolType: 'Internal AI application',
    useCase: '',
    businessOwner: '',
    technicalOwner: '',
    executiveSponsor: '',
    targetUsers: '',
    dataTypes: [],
    dataClassification: 'Internal',
    environment: 'Sandbox',
    model: '',
    agentEnabled: false,
    connectorEnabled: false,
    ragEnabled: false,
    externalVendor: false,
    clientData: false,
    pii: false,
    autonomousActions: false,
    selfHosted: false,
    createdAt: '',
    updatedAt: '',
    ...over,
  };
}

/** Fully-complete assessment: score 5, all controls & evidence checked. */
export function fullAssessment(teamId: TeamId): TeamAssessment {
  const lens = LENS_BY_ID[teamId];
  const a = makeEmptyAssessment(teamId);
  a.scopeRevision = 1;
  a.score = 5;
  lens.requiredControls.forEach((c) => (a.checkedControls[c.id] = true));
  lens.evidenceRequired.forEach((e) => (a.checkedEvidence[e.id] = true));
  a.evidenceLinks = lens.evidenceRequired.map((e) => ({ id: e.id, label: e.label, url: 'https://example.com/evidence', evidenceId: e.id, scopeRevision: 1 }));
  return a;
}

export function allFull(): Record<string, TeamAssessment> {
  const map: Record<string, TeamAssessment> = {};
  TEAM_LENSES.forEach((l) => (map[l.id] = fullAssessment(l.id)));
  return map;
}


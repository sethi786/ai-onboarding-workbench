import { describe, it, expect } from 'vitest';
import { toCsv } from '../toCsv';
import { computeScoreFromMap } from '../../engine/scoring';
import { buildReportContext } from '../reportContext';
import { TEAM_LENSES } from '../../data/teamLenses';
import { makeEmptyAssessment } from '../../types';
import type { Profile, TeamAssessment, TeamId } from '../../types';

function ctxFor(name: string, owner = '') {
  const profile: Profile = {
    id: 'p', name, platform: 'V', toolCategory: 'SaaS application',
    toolType: 'Business SaaS application', useCase: '', businessOwner: '', technicalOwner: '',
    executiveSponsor: '', targetUsers: '', dataTypes: [], dataClassification: 'Internal',
    environment: 'Pilot', model: '', agentEnabled: false, connectorEnabled: false,
    ragEnabled: false, externalVendor: true, clientData: false, pii: false,
    autonomousActions: false, selfHosted: false, createdAt: '', updatedAt: '',
  };
  const map = {} as Record<TeamId, TeamAssessment>;
  for (const l of TEAM_LENSES) {
    map[l.id] = makeEmptyAssessment(l.id);
    map[l.id].owner = owner;
  }
  const score = computeScoreFromMap(profile, TEAM_LENSES, map);
  return buildReportContext(profile, score, (id) => map[id] ?? makeEmptyAssessment(id), 'now');
}

describe('toCsv', () => {
  it('neutralises spreadsheet formula injection in user-controlled cells', () => {
    // The tool name and the reviewer's name reach this file, and it is opened
    // on somebody else's machine — often an auditor's.
    for (const payload of ["=cmd|'/c calc'!A0", '+1+1', '@SUM(A1)', '-2+3']) {
      expect(toCsv(ctxFor(payload)), payload).toContain(`"'${payload}`);
      expect(toCsv(ctxFor('Fine', payload)), payload).toContain(`"'${payload}`);
    }
  });

  it('leaves ordinary values unmangled', () => {
    const csv = toCsv(ctxFor('Northwind CRM'));
    expect(csv).toContain('Northwind CRM');
    expect(csv).not.toContain("'Northwind");
  });

  it('still escapes embedded quotes and commas', () => {
    expect(toCsv(ctxFor('Acme, "Pro"'))).toContain('"Acme, ""Pro"""');
  });
});

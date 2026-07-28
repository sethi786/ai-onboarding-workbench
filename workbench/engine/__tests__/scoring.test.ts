import { describe, it, expect } from 'vitest';
import { computeScoreFromMap, computeRisk } from '../scoring';
import { computeRecommendation } from '../recommendation';
import { TEAM_LENSES, LENS_BY_ID } from '../../data/teamLenses';
import { makeEmptyAssessment } from '../../types';
import type { Profile, TeamAssessment, TeamId } from '../../types';

function baseProfile(over: Partial<Profile> = {}): Profile {
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
function fullAssessment(teamId: TeamId): TeamAssessment {
  const lens = LENS_BY_ID[teamId];
  const a = makeEmptyAssessment(teamId);
  a.score = 5;
  lens.requiredControls.forEach((c) => (a.checkedControls[c.id] = true));
  lens.evidenceRequired.forEach((e) => (a.checkedEvidence[e.id] = true));
  return a;
}

function allFull(): Record<string, TeamAssessment> {
  const map: Record<string, TeamAssessment> = {};
  TEAM_LENSES.forEach((l) => (map[l.id] = fullAssessment(l.id)));
  return map;
}

describe('computeRisk', () => {
  it('is Low for a benign sandbox profile', () => {
    expect(computeRisk(baseProfile({ dataClassification: 'Public' }), false)).toBe('Low');
  });

  it('escalates with agents, connectors and autonomy', () => {
    const p = baseProfile({
      dataClassification: 'Restricted',
      clientData: true,
      autonomousActions: true,
    });
    expect(computeRisk(p, false)).toBe('Critical');
  });

  it('is Critical whenever a critical blocker is active', () => {
    expect(computeRisk(baseProfile(), true)).toBe('Critical');
  });
});

describe('computeRecommendation', () => {
  it('blocks on a critical blocker regardless of readiness', () => {
    expect(computeRecommendation(100, 'Low', true)).toBe('Blocked');
  });
  it('proceeds when readiness is high and risk is low', () => {
    expect(computeRecommendation(90, 'Low', false)).toBe('Proceed');
  });
  it('adds conditions in the 70-84 band', () => {
    expect(computeRecommendation(75, 'Low', false)).toBe('Proceed with Conditions');
  });
  it('is not ready below 50', () => {
    expect(computeRecommendation(20, 'High', false)).toBe('Not Ready for Review');
  });
});

describe('computeScoreFromMap', () => {
  it('gives ~100 readiness when every required team is fully complete and low risk', () => {
    const p = baseProfile({ dataClassification: 'Public' });
    const r = computeScoreFromMap(p, TEAM_LENSES, allFull());
    expect(r.readiness).toBe(100);
    expect(r.recommendation).toBe('Proceed');
    expect(r.controlsRemaining).toBe(0);
    expect(r.hasCriticalBlocker).toBe(false);
  });

  it('forces readiness to 0 when a critical blocker is active', () => {
    const p = baseProfile({ dataClassification: 'Public' });
    const map = allFull();
    // Activate a critical Security blocker (hardcoded secrets)
    map['security-sar'].activeBlockers['sar-b2'] = true;
    const r = computeScoreFromMap(p, TEAM_LENSES, map);
    expect(r.readiness).toBe(0);
    expect(r.hasCriticalBlocker).toBe(true);
    expect(r.recommendation).toBe('Blocked');
    expect(r.approvalStatus).toBe('Blocked');
  });

  it('requires Agent Governance only when agents are enabled', () => {
    const noAgent = computeScoreFromMap(baseProfile(), TEAM_LENSES, allFull());
    expect(noAgent.perTeam['agent-governance'].required).toBe(false);

    const withAgent = computeScoreFromMap(
      baseProfile({ agentEnabled: true }),
      TEAM_LENSES,
      allFull(),
    );
    expect(withAgent.perTeam['agent-governance'].required).toBe(true);
  });

  it('drops readiness when controls/evidence are incomplete', () => {
    const p = baseProfile({ dataClassification: 'Public' });
    const map: Record<string, TeamAssessment> = {};
    TEAM_LENSES.forEach((l) => {
      const a = makeEmptyAssessment(l.id);
      a.score = 5; // strong self-score but no controls/evidence checked
      map[l.id] = a;
    });
    const r = computeScoreFromMap(p, TEAM_LENSES, map);
    // score 5 -> 100, times completeness factor 0.5 (nothing checked) -> ~50
    expect(r.readiness).toBeLessThan(60);
    expect(r.readiness).toBeGreaterThan(40);
  });
});

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

  it('gives no credit for an unsubstantiated self-score', () => {
    const p = baseProfile({ dataClassification: 'Public' });
    const map: Record<string, TeamAssessment> = {};
    TEAM_LENSES.forEach((l) => {
      const a = makeEmptyAssessment(l.id);
      a.score = 5; // strong self-score but no controls/evidence checked
      map[l.id] = a;
    });
    const r = computeScoreFromMap(p, TEAM_LENSES, map);
    // The evidence sets the ceiling. No controls, no points — otherwise the
    // number a customer defends in a risk committee is just an opinion.
    expect(r.readiness).toBe(0);
  });

  it('ranks doing the work above claiming it', () => {
    const p = baseProfile({ dataClassification: 'Public' });

    const claimed: Record<string, TeamAssessment> = {};
    TEAM_LENSES.forEach((l) => {
      const a = makeEmptyAssessment(l.id);
      a.score = 5;
      claimed[l.id] = a;
    });

    const done: Record<string, TeamAssessment> = {};
    TEAM_LENSES.forEach((l) => {
      const a = fullAssessment(l.id);
      a.score = 3; // did everything, rated itself honestly
      done[l.id] = a;
    });

    const claimedScore = computeScoreFromMap(p, TEAM_LENSES, claimed).readiness;
    const doneScore = computeScoreFromMap(p, TEAM_LENSES, done).readiness;
    expect(doneScore).toBeGreaterThan(claimedScore);
  });

  it('distinguishes a review nobody started from one that failed', () => {
    const p = baseProfile({ dataClassification: 'Public' });

    const untouched: Record<string, TeamAssessment> = {};
    TEAM_LENSES.forEach((l) => (untouched[l.id] = makeEmptyAssessment(l.id)));
    const fresh = computeScoreFromMap(p, TEAM_LENSES, untouched);
    expect(fresh.recommendation).toBe('Not Started');
    expect(fresh.coverage).toBe(0);
    expect(fresh.teamsNotStarted).toBe(fresh.requiredTeams);

    const reviewed: Record<string, TeamAssessment> = {};
    TEAM_LENSES.forEach((l) => {
      const a = makeEmptyAssessment(l.id);
      a.score = 0;
      a.decision = 'Needs Remediation';
      reviewed[l.id] = a;
    });
    const failed = computeScoreFromMap(p, TEAM_LENSES, reviewed);
    expect(failed.recommendation).not.toBe('Not Started');
    expect(failed.coverage).toBe(1);
    expect(failed.teamsNotStarted).toBe(0);
  });

  it('refuses to clear a tool on a partial review, however well it scored', () => {
    const p = baseProfile({ dataClassification: 'Public' });
    const map: Record<string, TeamAssessment> = {};
    TEAM_LENSES.forEach((l) => (map[l.id] = makeEmptyAssessment(l.id)));

    const required = TEAM_LENSES.filter(
      (l) => computeScoreFromMap(p, TEAM_LENSES, map).perTeam[l.id].required,
    );
    // Perfect marks on the first required lens, nothing else touched.
    map[required[0].id] = fullAssessment(required[0].id);

    const r = computeScoreFromMap(p, TEAM_LENSES, map);
    expect(r.coverage).toBeLessThan(1);
    expect(r.recommendation).toBe('Review in Progress');
  });

  it('still reports bad news found early in a partial review', () => {
    const p = baseProfile({ dataClassification: 'Public' });
    const map: Record<string, TeamAssessment> = {};
    TEAM_LENSES.forEach((l) => (map[l.id] = makeEmptyAssessment(l.id)));

    const probe = computeScoreFromMap(p, TEAM_LENSES, map);
    const firstRequired = TEAM_LENSES.find((l) => probe.perTeam[l.id].required)!;
    const a = makeEmptyAssessment(firstRequired.id);
    a.score = 1;
    a.decision = 'Needs Remediation';
    map[firstRequired.id] = a;

    const r = computeScoreFromMap(p, TEAM_LENSES, map);
    // A poor result is actionable now; hiding it behind "in progress" would
    // waste the only window in which the team can still respond to it.
    expect(r.recommendation).not.toBe('Review in Progress');
    expect(r.recommendation).toBe('Not Ready for Review');
  });

  it('ignores blockers flagged on lenses that are out of scope', () => {
    const p = baseProfile({ dataClassification: 'Public' });
    const map = allFull();
    const clean = computeScoreFromMap(p, TEAM_LENSES, map);

    const outOfScope = TEAM_LENSES.find(
      (l) => !clean.perTeam[l.id].required && l.blockers.some((b) => b.critical),
    )!;
    const blocker = outOfScope.blockers.find((b) => b.critical)!;
    map[outOfScope.id].activeBlockers[blocker.id] = true;

    const after = computeScoreFromMap(p, TEAM_LENSES, map);
    expect(after.readiness).toBe(clean.readiness);
    expect(after.hasCriticalBlocker).toBe(false);
    expect(after.blockersCount).toBe(clean.blockersCount);
  });

  it('still zeroes readiness for a blocker on a lens that is in scope', () => {
    const p = baseProfile({ dataClassification: 'Public' });
    const map = allFull();
    const clean = computeScoreFromMap(p, TEAM_LENSES, map);

    const inScope = TEAM_LENSES.find(
      (l) => clean.perTeam[l.id].required && l.blockers.some((b) => b.critical),
    )!;
    const blocker = inScope.blockers.find((b) => b.critical)!;
    map[inScope.id].activeBlockers[blocker.id] = true;

    const after = computeScoreFromMap(p, TEAM_LENSES, map);
    expect(after.readiness).toBe(0);
    expect(after.hasCriticalBlocker).toBe(true);
    expect(after.recommendation).toBe('Blocked');
  });

  it('counts a review as signed off only when a decision was recorded', () => {
    const p = baseProfile({ dataClassification: 'Public' });
    const map = allFull(); // every control and evidence item done, score 5…
    const none = computeScoreFromMap(p, TEAM_LENSES, map);
    // …but nobody recorded a decision, so nothing is signed off.
    expect(none.teamsSignedOff).toBe(0);

    TEAM_LENSES.forEach((l) => (map[l.id].decision = 'Approved with Conditions'));
    const signed = computeScoreFromMap(p, TEAM_LENSES, map);
    expect(signed.teamsSignedOff).toBe(signed.requiredTeams);
  });
});

describe('an expired clearance is not a current one', () => {
  const p = baseProfile({ dataClassification: 'Public' });
  const cleared = () => {
    const map = allFull();
    TEAM_LENSES.forEach((l) => (map[l.id].decision = 'Approved'));
    return map;
  };

  it('reports Proceed while the clearance is current', () => {
    const r = computeScoreFromMap(p, TEAM_LENSES, cleared(), {
      validUntil: '2027-01-01',
      today: '2026-07-29',
    });
    expect(r.certification?.state).toBe('current');
    expect(r.recommendation).toBe('Proceed');
  });

  it('downgrades to Recertification Due once it lapses', () => {
    // The review itself did not get worse — it stopped being current. A stale
    // "Proceed" in an evidence pack is the failure this product is sold to
    // prevent, so the engine forces it rather than leaving it to each surface.
    const r = computeScoreFromMap(p, TEAM_LENSES, cleared(), {
      validUntil: '2026-01-01',
      today: '2026-07-29',
    });
    expect(r.certification?.state).toBe('expired');
    expect(r.recommendation).toBe('Recertification Due');
    expect(r.approvalStatus).toBe('In Progress');
    // Readiness is unchanged: the work was done, the clearance ran out.
    expect(r.readiness).toBeGreaterThan(0);
  });

  it('does not mask a blocker behind an expiry', () => {
    const map = cleared();
    const lens = TEAM_LENSES.find((l) => l.blockers.some((b) => b.critical))!;
    const blocker = lens.blockers.find((b) => b.critical)!;
    map[lens.id].activeBlockers[blocker.id] = true;
    const r = computeScoreFromMap(p, TEAM_LENSES, map, {
      validUntil: '2026-01-01',
      today: '2026-07-29',
    });
    expect(r.recommendation).toBe('Blocked');
  });

  it('carries no certification when it is not tracked', () => {
    expect(computeScoreFromMap(p, TEAM_LENSES, cleared()).certification).toBeNull();
  });
});

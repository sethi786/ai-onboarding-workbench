import { describe, it, expect } from 'vitest';
import {
  toPlanId,
  getPlan,
  hasFeature,
  evaluationQuota,
  memberQuota,
  upgradeTargetFor,
  PLANS,
} from '../plans';

describe('toPlanId', () => {
  it('recognises known plans', () => {
    expect(toPlanId('free')).toBe('free');
    expect(toPlanId('team')).toBe('team');
    expect(toPlanId('enterprise')).toBe('enterprise');
  });

  it('is case- and whitespace-insensitive', () => {
    expect(toPlanId('  TEAM ')).toBe('team');
    expect(toPlanId('Enterprise')).toBe('enterprise');
  });

  it('maps the legacy "pro" value to team', () => {
    expect(toPlanId('pro')).toBe('team');
  });

  it('fails closed on unknown, null, or empty values', () => {
    expect(toPlanId('platinum')).toBe('free');
    expect(toPlanId(null)).toBe('free');
    expect(toPlanId(undefined)).toBe('free');
    expect(toPlanId('')).toBe('free');
  });
});

describe('hasFeature', () => {
  it('lets a free workspace finish one review end to end', () => {
    // Starter is limited by volume, not capability. A trial that can't produce
    // the finished pack demonstrates the cost of governance and hides the value.
    expect(hasFeature('free', 'toolLibrary')).toBe(true);
    expect(hasFeature('free', 'evidenceFactory')).toBe(true);
    expect(hasFeature('free', 'exports')).toBe(true);
    expect(hasFeature('free', 'approvals')).toBe(true);
  });

  it('still reserves the org-scale features', () => {
    expect(hasFeature('free', 'sso')).toBe(false);
    expect(hasFeature('free', 'customLenses')).toBe(false);
  });

  it('includes workflow on every plan', () => {
    expect(hasFeature('free', 'workflow')).toBe(true);
    expect(hasFeature('team', 'workflow')).toBe(true);
    expect(hasFeature('enterprise', 'workflow')).toBe(true);
  });

  it('unlocks team features on team', () => {
    expect(hasFeature('team', 'evidenceFactory')).toBe(true);
    expect(hasFeature('team', 'exports')).toBe(true);
    expect(hasFeature('team', 'approvals')).toBe(true);
  });

  it('reserves SSO and custom lenses for enterprise', () => {
    expect(hasFeature('team', 'sso')).toBe(false);
    expect(hasFeature('team', 'customLenses')).toBe(false);
    expect(hasFeature('enterprise', 'sso')).toBe(true);
    expect(hasFeature('enterprise', 'customLenses')).toBe(true);
  });

  it('treats an unknown plan as free', () => {
    // Fails closed on the features that actually cost money to honour.
    expect(hasFeature('bogus', 'sso')).toBe(false);
    expect(hasFeature('bogus', 'customLenses')).toBe(false);
  });
});

describe('evaluationQuota', () => {
  it('allows the one free evaluation', () => {
    const q = evaluationQuota('free', 0);
    expect(q.allowed).toBe(true);
    expect(q.limit).toBe(1);
    expect(q.remaining).toBe(1);
  });

  it('blocks a second evaluation on free', () => {
    const q = evaluationQuota('free', 1);
    expect(q.allowed).toBe(false);
    expect(q.remaining).toBe(0);
  });

  it('blocks and clamps remaining when over the limit', () => {
    const q = evaluationQuota('free', 5);
    expect(q.allowed).toBe(false);
    expect(q.remaining).toBe(0);
  });

  it('is unlimited on paid plans', () => {
    const q = evaluationQuota('team', 500);
    expect(q.allowed).toBe(true);
    expect(q.limit).toBeNull();
    expect(q.remaining).toBeNull();
  });
});

describe('memberQuota', () => {
  it('gives a free workspace enough seats to be a review, not a solo exercise', () => {
    // Governance is multi-team by definition; a one-seat governance tool
    // contradicts its own premise.
    expect(memberQuota('free', 2).allowed).toBe(true);
    expect(memberQuota('free', 3).allowed).toBe(false);
  });

  it('allows many seats on team and unlimited on enterprise', () => {
    expect(memberQuota('team', 10).allowed).toBe(true);
    expect(memberQuota('team', 25).allowed).toBe(false);
    expect(memberQuota('enterprise', 10_000).allowed).toBe(true);
  });
});

describe('upgradeTargetFor', () => {
  it('points team-tier features at team', () => {
    expect(upgradeTargetFor('exports').id).toBe('team');
    expect(upgradeTargetFor('evidenceFactory').id).toBe('team');
  });

  it('points enterprise-only features at enterprise', () => {
    expect(upgradeTargetFor('sso').id).toBe('enterprise');
    expect(upgradeTargetFor('customLenses').id).toBe('enterprise');
  });
});

describe('plan definitions', () => {
  it('never loosens limits as tiers go down', () => {
    expect(PLANS.free.maxEvaluations).not.toBeNull();
    expect(PLANS.team.maxEvaluations).toBeNull();
    expect(PLANS.enterprise.maxEvaluations).toBeNull();
  });

  it('exposes a display name and price for each plan', () => {
    for (const plan of Object.values(PLANS)) {
      expect(plan.name).toBeTruthy();
      expect(plan.price).toBeTruthy();
    }
  });

  it('resolves definitions by raw value', () => {
    expect(getPlan('team').name).toBe('Team');
    expect(getPlan(null).name).toBe('Starter');
  });
});

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
  it('locks paid features on free', () => {
    expect(hasFeature('free', 'evidenceFactory')).toBe(false);
    expect(hasFeature('free', 'exports')).toBe(false);
    expect(hasFeature('free', 'toolLibrary')).toBe(false);
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
    expect(hasFeature('bogus', 'exports')).toBe(false);
  });
});

describe('evaluationQuota', () => {
  it('allows creation below the free limit', () => {
    const q = evaluationQuota('free', 2);
    expect(q.allowed).toBe(true);
    expect(q.limit).toBe(3);
    expect(q.remaining).toBe(1);
  });

  it('blocks creation at the limit', () => {
    const q = evaluationQuota('free', 3);
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
  it('caps free workspaces at a single seat', () => {
    expect(memberQuota('free', 1).allowed).toBe(false);
    expect(memberQuota('free', 0).allowed).toBe(true);
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

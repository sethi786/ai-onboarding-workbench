import { describe, expect, it } from 'vitest';
import type Stripe from 'stripe';
import { subscriptionPlan } from '../billing/subscription';
import { validateLead } from '../launch/leads';
import { readBody } from '../server/request-body';
import { TOOL_TEMPLATES, TOOL_TEMPLATE_BY_ID } from '@/data/tool-templates';
import { ASSESSMENT_TEMPLATES } from '@/data/assessment-templates';
import { makeEmptyAssessment } from '@/workbench/types';

const subscription = (status: string, price = 'price_team') =>
  ({
    status,
    items: { data: [{ price: { id: price } }] },
  }) as Stripe.Subscription;
describe('commercial readiness rules', () => {
  it('grants paid access only for an active configured Team subscription', () => {
    for (const status of [
      'trialing',
      'incomplete',
      'incomplete_expired',
      'past_due',
      'unpaid',
      'canceled',
      'paused',
    ])
      expect(subscriptionPlan([subscription(status)], 'price_team')).toBe(
        'free',
      );
    expect(
      subscriptionPlan([subscription('active', 'price_other')], 'price_team'),
    ).toBe('free');
    expect(subscriptionPlan([subscription('active')], 'price_team')).toBe(
      'team',
    );
    expect(subscriptionPlan([], 'price_team')).toBe('free');
  });
  it('keeps access when one subscription is canceled but a valid paid subscription remains', () =>
    expect(
      subscriptionPlan(
        [subscription('canceled'), subscription('active')],
        'price_team',
      ),
    ).toBe('team'));
  it('rejects honeypots, bad emails, missing verification and oversized enquiries', () => {
    const valid = {
      name: 'Buyer',
      email: 'BUYER@example.test',
      company: 'Acme',
      message: 'I would like a demo',
      kind: 'demo',
      token: 'test-token',
      website: '',
    };
    expect(validateLead(valid)?.email).toBe('buyer@example.test');
    for (const patch of [
      { name: '' },
      { email: 'not an email' },
      { message: 'short' },
      { message: 'a'.repeat(5001) },
      { token: '' },
      { website: 'spam' },
      { kind: 'purchase' },
    ])
      expect(validateLead({ ...valid, ...patch })).toBeNull();
  });
  it('enforces body byte limits even without a Content-Length', async () => {
    await expect(
      readBody(
        new Request('https://example.test', {
          method: 'POST',
          body: 'x'.repeat(11),
        }),
        10,
      ),
    ).rejects.toThrow('too large');
    expect(
      await readBody(
        new Request('https://example.test', { method: 'POST', body: 'hello' }),
        10,
      ),
    ).toBe('hello');
  });
});
describe('catalogue integrity', () => {
  it('has unique tools, vendor references, and six usable scenario starters', () => {
    expect(TOOL_TEMPLATES).toHaveLength(40);
    expect(ASSESSMENT_TEMPLATES).toHaveLength(6);
    expect(Object.keys(TOOL_TEMPLATE_BY_ID)).toHaveLength(46);
    for (const tool of TOOL_TEMPLATES)
      expect(new URL(tool.sourceUrl!).protocol).toBe('https:');
  });
  it('never seeds a score, completed control, evidence, approval, or a stale model version', () => {
    for (const template of Object.values(TOOL_TEMPLATE_BY_ID)) {
      expect(template.defaults.model || '').toBe('');
      for (const [team, patch] of Object.entries(template.suggested)) {
        const value = {
          ...makeEmptyAssessment(
            team as Parameters<typeof makeEmptyAssessment>[0],
          ),
          ...patch,
        };
        expect(value.score).toBe(-1);
        expect(value.decision).toBe('Not Reviewed');
        expect(Object.values(value.checkedControls).some(Boolean)).toBe(false);
        expect(Object.values(value.checkedEvidence).some(Boolean)).toBe(false);
      }
    }
  });
});

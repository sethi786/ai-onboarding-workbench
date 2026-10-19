import { afterEach, describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import { subscriptionPlan } from '../billing/subscription';
import { stripeEnvironmentAllowed, stripeLiveMode } from '../billing/mode';

const now = 1800000000;
const plan = (invoice: unknown, previousPlan = 'free') => subscriptionPlan([
  {
    status: 'active',
    latest_invoice: invoice,
    items: { data: [{ price: { id: 'price_team' } }] },
  } as Stripe.Subscription,
], 'price_team', { previousPlan, now });
const renewal = {
  status: 'draft',
  created: now - 60,
  billing_reason: 'subscription_cycle',
  collection_method: 'charge_automatically',
  auto_advance: true,
  attempt_count: 0,
};

afterEach(() => vi.unstubAllEnvs());
describe('payment evidence', () => {
  it.each(['open', 'draft', 'void', 'uncollectible'])('does not grant Team for an active but %s invoice', (status) => {
    expect(plan({ status })).toBe('free');
  });
  it('requires an invoice even when the subscription is active', () => {
    expect(plan(null)).toBe('free');
  });
  it('requires confirmed payment for a new customer, including delayed methods', () => {
    expect(plan(renewal)).toBe('free');
    expect(plan({ ...renewal, status: 'paid' })).toBe('team');
  });
  it('retains existing access briefly while an automatic renewal awaits its first attempt', () => {
    expect(plan(renewal, 'team')).toBe('team');
    expect(plan({ ...renewal, status: 'open' }, 'team')).toBe('team');
  });
  it.each([
    { created: now - 7200 },
    { created: now + 60 },
    { attempt_count: 1 },
    { auto_advance: false },
    { collection_method: 'send_invoice' },
    { billing_reason: 'subscription_create' },
    { billing_reason: 'subscription_update' },
    { status: 'void' },
    { status: 'uncollectible' },
  ])('ends the renewal allowance for %j', (patch) => {
    expect(plan({ ...renewal, ...patch }, 'team')).toBe('free');
  });
});
describe('Stripe environment separation', () => {
  it.each(['sk', 'rk'])('supports %s credentials in both modes', (prefix) => {
    expect(stripeLiveMode(`${prefix}_test_fixture`)).toBe(false);
    expect(stripeLiveMode(`${prefix}_live_fixture`)).toBe(true);
  });
  it.each(['', 'pk_test_fixture', 'invalid'])('fails closed for unsupported credentials', (key) => {
    vi.stubEnv('STRIPE_SECRET_KEY', key);
    expect(stripeEnvironmentAllowed()).toBe(false);
  });
  it.each(['preview', 'development'])('allows sandbox billing but blocks live billing in %s', (deployment) => {
    vi.stubEnv('VERCEL_ENV', deployment);
    vi.stubEnv('STRIPE_SECRET_KEY', 'rk_test_fixture');
    expect(stripeEnvironmentAllowed()).toBe(true);
    vi.stubEnv('STRIPE_SECRET_KEY', 'rk_live_fixture');
    expect(stripeEnvironmentAllowed()).toBe(false);
  });
  it('permits either explicit credential mode in production', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    for (const mode of ['test', 'live']) {
      vi.stubEnv('STRIPE_SECRET_KEY', `rk_${mode}_fixture`);
      expect(stripeEnvironmentAllowed()).toBe(true);
    }
  });
});

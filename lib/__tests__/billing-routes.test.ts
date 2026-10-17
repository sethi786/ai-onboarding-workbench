import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import Stripe from 'stripe';
const mock = vi.hoisted(() => ({
  workspace: vi.fn(),
  rpc: vi.fn(),
  org: vi.fn(),
  price: vi.fn(),
  sessions: vi.fn(),
  createCheckout: vi.fn(),
  createCustomer: vi.fn(),
  subscriptions: [] as unknown[],
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/billing/access', () => ({ billingWorkspace: mock.workspace }));
vi.mock('@/lib/server/service-client', () => ({
  serviceClient: () => ({
    rpc: mock.rpc,
    from: () => {
      const chain = {
        select: () => chain,
        eq: vi.fn(() => chain),
        update: () => chain,
        delete: () => chain,
        maybeSingle: mock.org,
        then: (resolve: (v: unknown) => unknown) =>
          Promise.resolve({ error: null }).then(resolve),
      };
      return chain;
    },
  }),
}));
vi.mock('@/lib/billing/config', async (importOriginal) => {
  const original = await importOriginal<typeof import('../billing/config')>();
  return {
    ...original,
    stripeClient: () => ({
      webhooks: new Stripe('sk_test_local_only').webhooks,
      prices: { retrieve: mock.price },
      customers: { create: mock.createCustomer },
      checkout: {
        sessions: { list: mock.sessions, create: mock.createCheckout },
      },
      subscriptions: {
        list: () => ({
          then: (resolve: (v: unknown) => unknown) =>
            Promise.resolve({ data: mock.subscriptions, has_more: false }).then(
              resolve,
            ),
          async *[Symbol.asyncIterator]() {
            yield* mock.subscriptions;
          },
        }),
      },
    }),
  };
});
import { POST as webhook } from '@/app/api/billing/webhook/route';
import { POST as checkout } from '@/app/api/billing/checkout/route';
const origin = 'https://aegis.example.test';
const request = () =>
  new Request(`${origin}/api/billing/checkout`, {
    method: 'POST',
    headers: { origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId: '10000000-0000-0000-0000-000000000001' }),
  });
function signed(type = 'customer.subscription.updated') {
  const payload = JSON.stringify({
    id: 'evt_test',
    type,
    data: {
      object: {
        id: 'sub_test',
        customer: 'cus_test',
        metadata: { org_id: 'forged-org' },
      },
    },
  });
  const header = Stripe.webhooks.generateTestHeaderString({
    payload,
    secret: 'whsec_local_test',
  });
  return new Request(`${origin}/api/billing/webhook`, {
    method: 'POST',
    headers: { 'stripe-signature': header },
    body: payload,
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  for (const [name, value] of Object.entries({
    STRIPE_SECRET_KEY: 'sk_test_local_only',
    STRIPE_WEBHOOK_SECRET: 'whsec_local_test',
    STRIPE_TEAM_PRICE_ID: 'price_team',
    SUPABASE_SERVICE_ROLE_KEY: 'test-only',
    NEXT_PUBLIC_SUPABASE_URL: 'https://db.example.test',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-only',
    NEXT_PUBLIC_SITE_URL: origin,
    NEXT_PUBLIC_LEGAL_ENTITY: 'Test operator',
    NEXT_PUBLIC_SUPPORT_EMAIL: 'support@example.test',
    LAUNCH_APPROVED: 'true',
  }))
    vi.stubEnv(name, value);
  mock.workspace.mockResolvedValue({
    org: {
      id: 'org',
      slug: 'workspace',
      plan: 'free',
      stripe_customer_id: 'cus_test',
    },
    user: { email: 'buyer@example.test' },
  });
  mock.rpc.mockResolvedValue({ data: true, error: null });
  mock.org.mockResolvedValue({ data: { id: 'org' }, error: null });
  mock.price.mockResolvedValue({
    active: true,
    currency: 'usd',
    unit_amount: 9900,
    recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed' },
  });
  mock.sessions.mockResolvedValue({ data: [] });
  mock.createCheckout.mockResolvedValue({
    url: 'https://checkout.stripe.com/test',
  });
  mock.subscriptions = [];
});
afterEach(() => vi.unstubAllEnvs());
describe('billing boundaries', () => {
  it('fails closed before launch configuration', async () => {
    vi.stubEnv('LAUNCH_APPROVED', 'false');
    expect((await checkout(request())).status).toBe(503);
    expect(mock.createCheckout).not.toHaveBeenCalled();
  });
  it('blocks cross-origin purchase attempts', async () => {
    const req = request();
    req.headers.set('origin', 'https://attacker.test');
    expect((await checkout(req)).status).toBe(403);
    expect(mock.workspace).not.toHaveBeenCalled();
  });
  it('requires an authorized workspace owner', async () => {
    mock.workspace.mockResolvedValue(null);
    expect((await checkout(request())).status).toBe(403);
    expect(mock.createCheckout).not.toHaveBeenCalled();
  });
  it('refuses a mismatched amount or billing interval', async () => {
    mock.price.mockResolvedValue({
      active: true,
      currency: 'usd',
      unit_amount: 49900,
      recurring: {
        interval: 'month',
        interval_count: 1,
        usage_type: 'licensed',
      },
    });
    expect((await checkout(request())).status).toBe(502);
    expect(mock.createCheckout).not.toHaveBeenCalled();
  });
  it('blocks a second subscription', async () => {
    mock.subscriptions = [{ status: 'active' }];
    expect((await checkout(request())).status).toBe(409);
    expect(mock.createCheckout).not.toHaveBeenCalled();
  });
  it('reuses an existing open checkout', async () => {
    mock.sessions.mockResolvedValue({
      data: [{ url: 'https://checkout.stripe.com/existing' }],
    });
    expect(await (await checkout(request())).json()).toEqual({
      url: 'https://checkout.stripe.com/existing',
    });
    expect(mock.createCheckout).not.toHaveBeenCalled();
  });
  it('starts a priced subscription without trusting amounts from the client', async () => {
    expect((await checkout(request())).status).toBe(200);
    expect(mock.createCheckout.mock.calls[0][0]).toMatchObject({
      mode: 'subscription',
      customer: 'cus_test',
      line_items: [{ price: 'price_team', quantity: 1 }],
    });
  });
  it('rejects forged webhook signatures before any database call', async () => {
    const req = signed();
    req.headers.set('stripe-signature', 'forged');
    expect((await webhook(req)).status).toBe(400);
    expect(mock.rpc).not.toHaveBeenCalled();
  });
  it('reconciles signed events against current provider data', async () => {
    mock.subscriptions = [
      { status: 'active', items: { data: [{ price: { id: 'price_team' } }] } },
    ];
    expect((await webhook(signed())).status).toBe(200);
    expect(mock.rpc).toHaveBeenCalledWith(
      'apply_billing_event',
      expect.objectContaining({
        p_event: 'evt_test',
        p_customer: 'cus_test',
        p_plan: 'team',
      }),
    );
  });
  it('returns a retryable failure when the database cannot save a payment event', async () => {
    mock.rpc.mockResolvedValue({ error: { message: 'database unavailable' } });
    expect((await webhook(signed())).status).toBe(500);
  });
  it('ignores unrelated customers and events', async () => {
    mock.org.mockResolvedValue({ data: null, error: null });
    expect((await webhook(signed())).status).toBe(200);
    expect(mock.rpc).not.toHaveBeenCalled();
    expect((await webhook(signed('charge.succeeded'))).status).toBe(200);
  });
});

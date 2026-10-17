import { randomUUID } from 'node:crypto';
import {
  billingConfigured,
  stripeClient,
  sameOrigin,
  siteOrigin,
} from '@/lib/billing/config';
import { billingWorkspace } from '@/lib/billing/access';
import { serviceClient } from '@/lib/server/service-client';
import { readBody } from '@/lib/server/request-body';
import { TEAM_MONTHLY_CENTS } from '@/lib/plans';

export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request) {
  if (!billingConfigured())
    return Response.json(
      { error: 'Checkout is not available yet. No charge has been made.' },
      { status: 503 },
    );
  if (!sameOrigin(request))
    return Response.json({ error: 'Invalid origin' }, { status: 403 });
  let body;
  try {
    body = JSON.parse(await readBody(request, 2000));
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }
  const access = await billingWorkspace(body?.orgId);
  if (!access)
    return Response.json(
      { error: 'Only the workspace owner can manage billing.' },
      { status: 403 },
    );
  if (access.org.plan === 'enterprise')
    return Response.json(
      { error: 'Contact us to change an Enterprise agreement.' },
      { status: 409 },
    );
  const db = serviceClient();
  const token = randomUUID();
  const lock = await db.rpc('claim_checkout', {
    p_org: access.org.id,
    p_token: token,
  });
  if (lock.error || !lock.data)
    return Response.json(
      {
        error: 'Another checkout request is in progress. Please retry shortly.',
      },
      { status: 409 },
    );
  try {
    const stripe = stripeClient();
    const priceId = process.env.STRIPE_TEAM_PRICE_ID!;
    const price = await stripe.prices.retrieve(priceId);
    if (
      !price.active ||
      price.currency !== 'usd' ||
      price.unit_amount !== TEAM_MONTHLY_CENTS ||
      price.recurring?.interval !== 'month' ||
      price.recurring.interval_count !== 1 ||
      price.recurring.usage_type !== 'licensed'
    )
      throw new Error('Price configuration mismatch');
    let customer = access.org.stripe_customer_id;
    if (!customer) {
      const created = await stripe.customers.create(
        {
          email: access.user.email,
          name: access.org.name,
          metadata: { org_id: access.org.id },
        },
        { idempotencyKey: `aegis-customer-${access.org.id}` },
      );
      customer = created.id;
      const saved = await db
        .from('organizations')
        .update({ stripe_customer_id: customer })
        .eq('id', access.org.id);
      if (saved.error) throw saved.error;
    }
    const subscriptions = await stripe.subscriptions.list({
      customer,
      status: 'all',
      limit: 100,
    });
    if (
      subscriptions.has_more ||
      subscriptions.data.some(
        (s) => !['canceled', 'incomplete_expired'].includes(s.status),
      )
    )
      return Response.json(
        {
          error:
            'A subscription already exists. Use Manage billing to update it.',
        },
        { status: 409 },
      );
    const sessions = await stripe.checkout.sessions.list({
      customer,
      status: 'open',
      limit: 1,
    });
    if (sessions.data[0]?.url)
      return Response.json({ url: sessions.data[0].url });
    const path = `${siteOrigin()}/portal/${access.org.slug}/settings/billing`;
    const session = await stripe.checkout.sessions.create(
      {
        customer,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: access.org.id,
        metadata: { org_id: access.org.id },
        subscription_data: { metadata: { org_id: access.org.id } },
        success_url: `${path}?checkout=success`,
        cancel_url: `${path}?checkout=canceled`,
        billing_address_collection: 'required',
        automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === 'true' },
        customer_update: { address: 'auto', name: 'auto' },
        consent_collection: { terms_of_service: 'required' },
        expires_at: Math.floor(Date.now() / 1000) + 1800,
      },
      { idempotencyKey: `aegis-checkout-${token}` },
    );
    return Response.json({ url: session.url });
  } catch {
    return Response.json(
      { error: 'We could not open checkout. Please retry or contact support.' },
      { status: 502 },
    );
  } finally {
    await db
      .from('billing_checkout_locks')
      .delete()
      .eq('org_id', access.org.id)
      .eq('token', token);
  }
}

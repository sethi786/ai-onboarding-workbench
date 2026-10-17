import type Stripe from 'stripe';
import { stripeClient } from '@/lib/billing/config';
import { stripeEnvironmentAllowed, stripeLiveMode } from '@/lib/billing/mode';
import { subscriptionPlan } from '@/lib/billing/subscription';
import { serviceClient } from '@/lib/server/service-client';
import { readBody } from '@/lib/server/request-body';

export const runtime = 'nodejs';
export const maxDuration = 60;
const supported = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.payment_action_required',
  'invoice.finalization_failed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
]);
export async function POST(request: Request) {
  if (
    !process.env.STRIPE_WEBHOOK_SECRET ||
    !stripeEnvironmentAllowed() ||
    !process.env.STRIPE_TEAM_PRICE_ID ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  )
    return Response.json({ error: 'Unavailable' }, { status: 503 });
  let event: Stripe.Event;
  const stripe = stripeClient();
  try {
    event = stripe.webhooks.constructEvent(
      await readBody(request, 1000000),
      request.headers.get('stripe-signature') || '',
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return Response.json(
      { error: 'Invalid signature or payload' },
      { status: 400 },
    );
  }
  if (event.livemode !== stripeLiveMode())
    return Response.json({ error: 'Billing mode mismatch' }, { status: 400 });
  if (!supported.has(event.type)) return Response.json({ received: true });
  const object = event.data.object as
    | Stripe.Subscription
    | Stripe.Invoice
    | Stripe.Checkout.Session;
  const customer =
    typeof object.customer === 'string' ? object.customer : object.customer?.id;
  if (!customer)
    return Response.json({ error: 'Missing customer' }, { status: 400 });
  try {
    const db = serviceClient();
    const org = await db
      .from('organizations')
      .select('id, plan')
      .eq('stripe_customer_id', customer)
      .maybeSingle();
    if (org.error) throw org.error;
    // A shared Stripe account may have customers belonging to other products.
    if (!org.data) return Response.json({ received: true });
    const observedAt = new Date().toISOString();
    const subscriptions: Stripe.Subscription[] = [];
    for await (const subscription of stripe.subscriptions.list({
      customer,
      status: 'all',
      limit: 100,
      expand: ['data.latest_invoice'],
    }))
      subscriptions.push(subscription);
    // Retrieve current provider state: event order and the success URL never grant access.
    const result = await db.rpc('apply_billing_event', {
      p_event: event.id,
      p_customer: customer,
      p_plan: subscriptionPlan(subscriptions, process.env.STRIPE_TEAM_PRICE_ID, {
        previousPlan: org.data.plan,
      }),
      p_observed_at: observedAt,
    });
    if (result.error) throw result.error;
    return Response.json({ received: true });
  } catch {
    return Response.json(
      { error: 'Billing sync failed; retry required' },
      { status: 500 },
    );
  }
}

import type Stripe from 'stripe';

type ReconciliationContext = { previousPlan?: string; now?: number };

/** Active alone can also mean an unpaid invoice or a pending delayed payment. */
export function isTeamSubscription(
  subscription: Stripe.Subscription,
  priceId: string,
  { previousPlan, now = Date.now() / 1000 }: ReconciliationContext = {},
) {
  if (
    subscription.status !== 'active' ||
    !subscription.items.data.some((item) => item.price.id === priceId)
  )
    return false;
  const invoice = subscription.latest_invoice;
  // An unexpanded response is a provider/read failure, not evidence of nonpayment.
  if (typeof invoice === 'string') throw new Error('Invoice expansion required');
  if (!invoice) return false;
  if (invoice.status === 'paid') return true;
  // Stripe normally leaves renewal invoices in draft for about an hour. Retain
  // existing access during automatic processing, never grant a new paid plan.
  // A failed attempt, manual collection, or stale draft ends this allowance.
  return (
    previousPlan === 'team' &&
    invoice.billing_reason === 'subscription_cycle' &&
    invoice.collection_method === 'charge_automatically' &&
    invoice.auto_advance &&
    ['draft', 'open'].includes(invoice.status || '') &&
    invoice.attempt_count === 0 &&
    now >= invoice.created &&
    now - invoice.created < 2 * 60 * 60
  );
}

export function subscriptionPlan(
  subscriptions: Stripe.Subscription[],
  priceId: string,
  context: ReconciliationContext = {},
) {
  return subscriptions.some((sub) => isTeamSubscription(sub, priceId, context))
    ? ('team' as const)
    : ('free' as const);
}

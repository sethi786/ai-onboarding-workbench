import type Stripe from 'stripe';

/** A paid active subscription to our exact configured price grants Team access. */
export function isTeamSubscription(
  subscription: Stripe.Subscription,
  priceId: string,
) {
  return (
    subscription.status === 'active' &&
    subscription.items.data.some((item) => item.price.id === priceId)
  );
}

export function subscriptionPlan(
  subscriptions: Stripe.Subscription[],
  priceId: string,
) {
  return subscriptions.some((sub) => isTeamSubscription(sub, priceId))
    ? ('team' as const)
    : ('free' as const);
}

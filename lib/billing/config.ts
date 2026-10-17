import 'server-only';
import Stripe from 'stripe';
import { launchChecks } from '@/lib/launch/readiness';
import { stripeEnvironmentAllowed } from './mode';

export function billingConfigured() {
  const checks = launchChecks();
  return (
    checks.authentication &&
    checks.serviceAccess &&
    checks.payments &&
    checks.domain &&
    checks.identity &&
    checks.releaseApproved
  );
}

export function stripeClient() {
  if (!stripeEnvironmentAllowed()) throw new Error('Billing unavailable');
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    maxNetworkRetries: 2,
    timeout: 15000,
  });
}

export function siteOrigin() {
  const url = new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  );
  if (
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    (url.protocol !== 'https:' && url.hostname !== 'localhost')
  )
    throw new Error('Invalid site origin');
  return url.origin;
}

export function sameOrigin(request: Request) {
  return request.headers.get('origin') === siteOrigin();
}

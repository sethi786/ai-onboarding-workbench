import {
  billingConfigured,
  stripeClient,
  sameOrigin,
  siteOrigin,
} from '@/lib/billing/config';
import { billingWorkspace } from '@/lib/billing/access';
import { readBody } from '@/lib/server/request-body';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request) {
  if (!billingConfigured())
    return Response.json(
      { error: 'Billing management is temporarily unavailable.' },
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
  if (!access || !access.org.stripe_customer_id)
    return Response.json(
      { error: 'Only an owner with an existing billing account can continue.' },
      { status: 403 },
    );
  try {
    const session = await stripeClient().billingPortal.sessions.create({
      customer: access.org.stripe_customer_id,
      return_url: `${siteOrigin()}/portal/${access.org.slug}/settings/billing`,
    });
    return Response.json({ url: session.url });
  } catch {
    return Response.json(
      { error: 'Could not open billing management. Please retry.' },
      { status: 502 },
    );
  }
}

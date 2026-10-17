import { leadsConfigured } from '@/lib/launch/readiness';
import { validateLead } from '@/lib/launch/leads';
import { sameOrigin, siteOrigin } from '@/lib/billing/config';
import { serviceClient } from '@/lib/server/service-client';
import { readBody } from '@/lib/server/request-body';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!leadsConfigured())
    return Response.json(
      {
        error:
          'Enquiries are temporarily unavailable. Your message has not been submitted.',
      },
      { status: 503 },
    );
  if (!sameOrigin(request))
    return Response.json({ error: 'Invalid origin' }, { status: 403 });
  let body;
  try {
    body = JSON.parse(await readBody(request));
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }
  const lead = validateLead(body);
  if (!lead)
    return Response.json(
      { error: 'Check the form and complete the verification.' },
      { status: 400 },
    );
  try {
    const verification = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY!,
          response: lead.token,
        }),
        signal: AbortSignal.timeout(10000),
      },
    );
    const result = await verification.json();
    if (
      !verification.ok ||
      !result.success ||
      result.hostname !== new URL(siteOrigin()).hostname ||
      result.action !== 'enquiry'
    )
      return Response.json(
        { error: 'Verification expired or failed. Please try again.' },
        { status: 400 },
      );
    const saved = await serviceClient().rpc('submit_sales_lead', {
      p_name: lead.name,
      p_email: lead.email,
      p_company: lead.company,
      p_message: lead.message,
      p_kind: lead.kind,
    });
    if (saved.error)
      return Response.json(
        {
          error: saved.error.message.includes('Too many')
            ? 'You have submitted several requests. Please try again in an hour.'
            : 'We could not save your request. Please retry.',
        },
        { status: saved.error.message.includes('Too many') ? 429 : 503 },
      );
    return Response.json({ reference: saved.data }, { status: 201 });
  } catch {
    return Response.json(
      { error: 'We could not submit your request. Please retry.' },
      { status: 503 },
    );
  }
}

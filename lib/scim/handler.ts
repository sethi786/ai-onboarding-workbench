import 'server-only';
import { NextResponse } from 'next/server';
import { SCIM_CONTENT_TYPE, bearerFrom, scimError } from './protocol';
import { authenticate, type ScimContext } from './store';

/**
 * Shared plumbing for the SCIM routes: authenticate, run, and make sure every
 * response — including failures — is well-formed SCIM.
 *
 * That last part matters more than it sounds. Entra disables a provisioning
 * job outright after a run of non-conforming responses, and an unhandled
 * exception returning Next's HTML error page is exactly such a response. So
 * this wrapper is the only place these routes are allowed to throw from.
 */

export function scimJson(body: unknown, status = 200) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: { 'content-type': SCIM_CONTENT_TYPE },
  });
}

export function scimFail(status: number, detail: string, scimType?: string) {
  const e = scimError(status, detail, scimType);
  return scimJson(e.body, e.status);
}

/** Base URL the provider used, so `meta.location` points back at the caller. */
export function scimBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.origin}/api/scim/v2`;
}

export async function withScim(
  request: Request,
  run: (ctx: ScimContext) => Promise<NextResponse>,
): Promise<NextResponse> {
  const token = bearerFrom(request.headers.get('authorization'));
  if (!token) {
    return scimFail(401, 'A bearer token is required.');
  }

  let ctx: ScimContext | null;
  try {
    ctx = await authenticate(token);
  } catch {
    return scimFail(503, 'Directory service temporarily unavailable.');
  }
  if (!ctx) {
    // Deliberately identical for an unknown token and a revoked one: telling
    // a caller which it was confirms that a token existed.
    return scimFail(401, 'Invalid or revoked token.');
  }

  try {
    return await run(ctx);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    if (/unauthorized/i.test(message)) return scimFail(401, 'Invalid or revoked token.');
    if (/userName is required/i.test(message)) {
      return scimFail(400, 'userName is required.', 'invalidValue');
    }
    return scimFail(500, message);
  }
}

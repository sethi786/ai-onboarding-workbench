import { listResponse, parseUserNameFilter, toScimUser } from '@/lib/scim/protocol';
import { scimBaseUrl, scimFail, scimJson, withScim } from '@/lib/scim/handler';
import { listUsers, putUser } from '@/lib/scim/store';

export const dynamic = 'force-dynamic';

/**
 * GET /api/scim/v2/Users — list, or look one up by userName.
 *
 * Provisioning always starts here: before creating anybody, Okta and Entra
 * both filter on userName to see whether the account already exists. Returning
 * an empty list where a user does exist causes duplicate creates; returning an
 * error causes the run to abort.
 */
export async function GET(request: Request) {
  return withScim(request, async (ctx) => {
    const url = new URL(request.url);
    const userName = parseUserNameFilter(url.searchParams.get('filter'));
    const startIndex = Math.max(1, Number(url.searchParams.get('startIndex') ?? '1') || 1);
    const count = Math.min(500, Math.max(0, Number(url.searchParams.get('count') ?? '100') || 100));

    const { rows, total } = await listUsers(ctx, { userName, startIndex, count });
    const base = scimBaseUrl(request);
    return scimJson(listResponse(rows.map((r) => toScimUser(r, base)), total, startIndex));
  });
}

/**
 * POST /api/scim/v2/Users — create.
 *
 * Idempotent on userName rather than strict-201-or-409. Both providers retry
 * a create after a transient failure, and answering the retry with a conflict
 * leaves the user provisioned in the directory and absent here — the failure
 * mode that silently denies a new joiner their access.
 */
export async function POST(request: Request) {
  return withScim(request, async (ctx) => {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return scimFail(400, 'Request body must be JSON.', 'invalidSyntax');
    }

    const userName = typeof body.userName === 'string' ? body.userName.trim() : '';
    if (!userName) return scimFail(400, 'userName is required.', 'invalidValue');

    const name = (body.name ?? {}) as Record<string, unknown>;
    const row = await putUser(ctx, {
      userName,
      externalId: typeof body.externalId === 'string' ? body.externalId : null,
      givenName: typeof name.givenName === 'string' ? name.givenName : null,
      familyName: typeof name.familyName === 'string' ? name.familyName : null,
      displayName: typeof body.displayName === 'string' ? body.displayName : null,
      active: body.active === undefined ? true : body.active === true || body.active === 'true',
    });

    return scimJson(toScimUser(row, scimBaseUrl(request)), 201);
  });
}

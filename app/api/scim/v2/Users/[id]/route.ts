import { NextResponse } from 'next/server';
import { applyPatch, toScimUser } from '@/lib/scim/protocol';
import { scimBaseUrl, scimFail, scimJson, withScim } from '@/lib/scim/handler';
import { deleteUser, getUser, putUser, setActive } from '@/lib/scim/store';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Ctx) {
  const { id } = await params;
  return withScim(request, async (ctx) => {
    const row = await getUser(ctx, id);
    if (!row) return scimFail(404, 'User not found.');
    return scimJson(toScimUser(row, scimBaseUrl(request)));
  });
}

/** Full replace. Okta uses this for profile updates. */
export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  return withScim(request, async (ctx) => {
    const existing = await getUser(ctx, id);
    if (!existing) return scimFail(404, 'User not found.');

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return scimFail(400, 'Request body must be JSON.', 'invalidSyntax');
    }

    const name = (body.name ?? {}) as Record<string, unknown>;
    const row = await putUser(ctx, {
      // A PUT that omits userName must not blank it — keep what we hold.
      userName: typeof body.userName === 'string' && body.userName ? body.userName : existing.user_name,
      externalId: typeof body.externalId === 'string' ? body.externalId : existing.external_id,
      givenName: typeof name.givenName === 'string' ? name.givenName : null,
      familyName: typeof name.familyName === 'string' ? name.familyName : null,
      displayName: typeof body.displayName === 'string' ? body.displayName : null,
      active: body.active === undefined ? existing.active : body.active === true || body.active === 'true',
    });
    return scimJson(toScimUser(row, scimBaseUrl(request)));
  });
}

/**
 * PATCH — the operation that offboards somebody.
 *
 * Entra deactivates with a PatchOp rather than a DELETE, and it is the single
 * most important request this API serves: getting it wrong leaves a departed
 * employee with access. See applyPatch for the three shapes it arrives in.
 */
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  return withScim(request, async (ctx) => {
    const existing = await getUser(ctx, id);
    if (!existing) return scimFail(404, 'User not found.');

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return scimFail(400, 'Request body must be JSON.', 'invalidSyntax');
    }

    const patch = applyPatch(body);
    const row =
      patch.active !== undefined && Object.keys(patch).length === 1
        ? await setActive(ctx, id, patch.active)
        : await putUser(ctx, {
            userName: patch.userName ?? existing.user_name,
            externalId: patch.externalId ?? existing.external_id,
            givenName: patch.givenName ?? existing.given_name,
            familyName: patch.familyName ?? existing.family_name,
            displayName: patch.displayName ?? existing.display_name,
            active: patch.active ?? existing.active,
          });

    if (!row) return scimFail(404, 'User not found.');
    return scimJson(toScimUser(row, scimBaseUrl(request)));
  });
}

/** Okta offboards with DELETE. */
export async function DELETE(request: Request, { params }: Ctx) {
  const { id } = await params;
  return withScim(request, async (ctx) => {
    const ok = await deleteUser(ctx, id);
    if (!ok) return scimFail(404, 'User not found.');
    return new NextResponse(null, { status: 204 });
  });
}

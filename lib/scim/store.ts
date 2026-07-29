import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { supabaseEnv } from '@/lib/supabase/env';
import { hashScimToken, type ScimUserRow } from './protocol';

/**
 * Data access for the SCIM endpoints.
 *
 * The caller is an identity provider holding a bearer token, not a signed-in
 * user, so there is no session and RLS keyed on auth.uid() cannot gate
 * anything. Every call therefore goes through a SECURITY DEFINER function that
 * authenticates the token hash itself and can only ever reach the one
 * organization that token belongs to — see migration 0011. The anon key is
 * enough to invoke them, which keeps the service-role key out of request-path
 * code entirely: a bug in a route handler cannot become a cross-tenant read,
 * because the route has no way to name another tenant.
 */

function anonClient() {
  const { url, anonKey } = supabaseEnv();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface ScimContext {
  orgId: string;
  tokenHash: string;
}

/** Resolve a presented bearer token to its workspace, or null. */
export async function authenticate(token: string): Promise<ScimContext | null> {
  const tokenHash = hashScimToken(token);
  const supabase = anonClient();
  const { data, error } = await supabase.rpc('scim_org_for_token', { p_token_hash: tokenHash });
  if (error || !data) return null;
  return { orgId: data as string, tokenHash };
}

export async function listUsers(
  ctx: ScimContext,
  opts: { userName?: string; startIndex: number; count: number },
): Promise<{ rows: ScimUserRow[]; total: number }> {
  const supabase = anonClient();
  const [list, count] = await Promise.all([
    supabase.rpc('scim_list_users', {
      p_token_hash: ctx.tokenHash,
      p_user_name: opts.userName ?? null,
      p_start: opts.startIndex,
      p_count: opts.count,
    }),
    supabase.rpc('scim_count_users', {
      p_token_hash: ctx.tokenHash,
      p_user_name: opts.userName ?? null,
    }),
  ]);
  if (list.error) throw new Error(list.error.message);
  return { rows: (list.data ?? []) as ScimUserRow[], total: (count.data as number) ?? 0 };
}

export async function getUser(ctx: ScimContext, id: string): Promise<ScimUserRow | null> {
  const supabase = anonClient();
  const { data, error } = await supabase.rpc('scim_get_user', {
    p_token_hash: ctx.tokenHash,
    p_id: id,
  });
  if (error) throw new Error(error.message);
  const row = data as ScimUserRow | null;
  return row?.id ? row : null;
}

export interface PutUserInput {
  userName: string;
  externalId?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  displayName?: string | null;
  active?: boolean;
}

export async function putUser(ctx: ScimContext, input: PutUserInput): Promise<ScimUserRow> {
  const supabase = anonClient();
  const { data, error } = await supabase.rpc('scim_put_user', {
    p_token_hash: ctx.tokenHash,
    p_user_name: input.userName,
    p_external_id: input.externalId ?? null,
    p_given_name: input.givenName ?? null,
    p_family_name: input.familyName ?? null,
    p_display_name: input.displayName ?? null,
    p_active: input.active ?? true,
    p_role: null,
  });
  if (error) throw new Error(error.message);
  return data as ScimUserRow;
}

export async function setActive(
  ctx: ScimContext,
  id: string,
  active: boolean,
): Promise<ScimUserRow | null> {
  const supabase = anonClient();
  const { data, error } = await supabase.rpc('scim_set_active', {
    p_token_hash: ctx.tokenHash,
    p_id: id,
    p_active: active,
  });
  if (error) throw new Error(error.message);
  const row = data as ScimUserRow | null;
  return row?.id ? row : null;
}

export async function deleteUser(ctx: ScimContext, id: string): Promise<boolean> {
  const supabase = anonClient();
  const { data, error } = await supabase.rpc('scim_delete_user', {
    p_token_hash: ctx.tokenHash,
    p_id: id,
  });
  if (error) throw new Error(error.message);
  return data === true;
}

import 'server-only';
import { createClient } from '@/lib/supabase/server';

/**
 * Admit an SSO caller to the workspace that owns their email domain.
 *
 * Called once, right after Supabase Auth has established the session. The
 * decision lives in Postgres (`sso_claim_membership`) rather than here on
 * purpose: it has to read the verified domain, consult what SCIM says when the
 * workspace requires it, and write a membership — all things the caller has no
 * permission to do for themselves, and none of which should be re-implemented
 * in a route handler where a missing check is invisible.
 *
 * Returns the workspace slug to land in, or null when the caller's domain
 * isn't claimed, isn't verified, or SCIM hasn't provisioned them.
 */
export async function claimSsoMembership(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('sso_claim_membership');
  // A failure here must not block sign-in: the user may already be a member by
  // invitation, in which case the portal will route them normally.
  if (error) return null;
  return (data as string | null) ?? null;
}

/** The domain part of an email, lowercased. */
export function domainOf(email: string): string {
  const at = email.lastIndexOf('@');
  return at === -1 ? '' : email.slice(at + 1).toLowerCase();
}

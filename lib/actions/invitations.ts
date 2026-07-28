'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';

export interface InvitationPreview {
  orgName: string;
  orgSlug: string;
  email: string;
  role: string;
  accepted: boolean;
}

/**
 * Read an invitation by token. Runs through a SECURITY DEFINER RPC because the
 * invitee is not a member yet, so RLS would otherwise hide the row from them.
 */
export async function previewInvitation(token: string): Promise<InvitationPreview | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('invitation_preview', { p_token: token });
  if (error || !data || data.length === 0) return null;
  const row = data[0] as {
    org_name: string;
    org_slug: string;
    email: string;
    role: string;
    accepted: boolean;
  };
  return {
    orgName: row.org_name,
    orgSlug: row.org_slug,
    email: row.email,
    role: row.role,
    accepted: row.accepted,
  };
}

/**
 * Redeem an invitation for the signed-in user. The RPC verifies the caller's
 * email matches the invite, so a leaked token can't join the wrong account.
 */
export async function acceptInvitation(token: string): Promise<{ error?: string }> {
  await requireUser(`/invite/${token}`);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('accept_invitation', { p_token: token });
  if (error) return { error: error.message };
  if (!data) return { error: 'This invitation link is not valid.' };

  revalidatePath('/portal', 'layout');
  redirect(`/portal/${data}/dashboard`);
}

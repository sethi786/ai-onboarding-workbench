'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';
import { assertMemberQuota, getOrgPlan } from '@/lib/auth/entitlements';
import { slugify, randomSuffix } from '@/lib/slug';
import { SITE } from '@/lib/site';

export interface ActionResult {
  error?: string;
}

/** Create an org via the SECURITY DEFINER RPC, then jump into it. */
export async function createOrganization(formData: FormData): Promise<ActionResult> {
  await requireUser();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return { error: 'Organization name is required.' };

  const slug = `${slugify(name) || 'org'}-${randomSuffix()}`;
  const supabase = await createClient();
  const { error } = await supabase.rpc('create_organization', { p_name: name, p_slug: slug });
  if (error) return { error: error.message };

  revalidatePath('/portal');
  redirect(`/portal/${slug}/dashboard`);
}

/**
 * Invite a member by email (owner/admin only, enforced by RLS).
 *
 * There's no transactional email provider wired up, so the invite link is
 * returned to the inviter to share. That's deliberate — silently recording an
 * invitation nobody can act on is worse than handing over a link.
 */
export async function inviteMember(
  orgId: string,
  formData: FormData,
): Promise<ActionResult & { inviteUrl?: string }> {
  const user = await requireUser();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const role = String(formData.get('role') ?? 'member');
  if (!email) return { error: 'Email is required.' };

  const plan = await getOrgPlan(orgId);
  if (plan === null) return { error: 'Workspace not found.' };
  const seatError = await assertMemberQuota(orgId, plan);
  if (seatError) return { error: seatError };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('invitations')
    .insert({ org_id: orgId, email, role: role as never, invited_by: user.id })
    .select('token')
    .single();
  if (error) return { error: error.message };
  if (!data) return { error: 'You don’t have permission to invite members here.' };

  revalidatePath('/portal', 'layout');
  return { inviteUrl: `${SITE.url}/invite/${data.token}` };
}

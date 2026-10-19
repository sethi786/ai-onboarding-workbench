'use server';

import { revalidatePath } from 'next/cache';
import { requireMembership } from '@/lib/auth/membership';
import { requireUser } from '@/lib/auth/require-user';
import { createClient } from '@/lib/supabase/server';
import { canManageOrg } from '@/lib/rbac';
import type { OrgRole } from '@/lib/db/types';

export async function renameWorkspace(
  orgSlug: string,
  name: string,
): Promise<{ error?: string }> {
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    name.trim().length > 120 ||
    /[\u0000-\u001f\u007f]/.test(name)
  ) {
    return { error: 'Enter a workspace name between 1 and 120 characters.' };
  }
  const { org, role } = await requireMembership(orgSlug);
  if (!canManageOrg(role))
    return {
      error: 'Only workspace owners and admins can rename the workspace.',
    };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organizations')
    .update({ name: name.trim() })
    .eq('id', org.id)
    .select('id');
  if (error || !data?.length)
    return { error: 'Could not update the workspace. Refresh and try again.' };
  revalidatePath('/portal', 'layout');
  return {};
}

export async function changeWorkspaceMember(
  orgSlug: string,
  membershipId: string,
  nextRole: OrgRole | 'remove',
): Promise<{ error?: string }> {
  if (
    !/^[a-f0-9-]{36}$/i.test(membershipId) ||
    !['owner', 'admin', 'member', 'viewer', 'remove'].includes(nextRole)
  ) {
    return { error: 'Invalid member change.' };
  }
  const user = await requireUser();
  const { org, role } = await requireMembership(orgSlug);
  if (role !== 'owner')
    return { error: 'Only workspace owners can change access.' };
  const supabase = await createClient();
  const { data: member, error: readError } = await supabase
    .from('memberships')
    .select('user_id')
    .eq('id', membershipId)
    .eq('org_id', org.id)
    .maybeSingle();
  if (readError || !member)
    return { error: 'Member not found. Refresh the member list.' };
  if (member.user_id === user.id)
    return { error: 'Ask another owner to change your access.' };
  const query =
    nextRole === 'remove'
      ? supabase.from('memberships').delete()
      : supabase.from('memberships').update({ role: nextRole });
  const { data, error } = await query
    .eq('id', membershipId)
    .eq('org_id', org.id)
    .select('id');
  if (error || !data?.length)
    return {
      error:
        'Access was not changed. Refresh and try again; a workspace must keep an owner.',
    };
  revalidatePath(`/portal/${orgSlug}`, 'layout');
  return {};
}

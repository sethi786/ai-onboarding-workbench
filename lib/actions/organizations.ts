'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';
import { slugify, randomSuffix } from '@/lib/slug';

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

/** Invite a member by email (owner/admin only, enforced by RLS). */
export async function inviteMember(orgId: string, formData: FormData): Promise<ActionResult> {
  await requireUser();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const role = String(formData.get('role') ?? 'member');
  if (!email) return { error: 'Email is required.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('invitations')
    .insert({ org_id: orgId, email, role: role as never });
  if (error) return { error: error.message };
  revalidatePath('/portal', 'layout');
  return {};
}

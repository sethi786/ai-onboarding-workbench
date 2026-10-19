'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';
import { TOOL_TEMPLATE_BY_ID } from '@/data/tool-templates';
import { slugify, randomSuffix } from '@/lib/slug';

export interface ActionResult {
  error?: string;
  token?: string;
}

/** Create an org via the SECURITY DEFINER RPC, then jump into it. */
export async function createOrganization(
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();
  const name = String(formData.get('name') ?? '').trim();
  if (!name || name.length > 120)
    return { error: 'Organization name is required.' };

  const slug = `${slugify(name) || 'org'}-${randomSuffix()}`;
  const supabase = await createClient();
  const { error } = await supabase.rpc('create_organization', {
    p_name: name,
    p_slug: slug,
  });
  if (error) return { error: error.message };

  revalidatePath('/portal');
  const template = String(formData.get('template') ?? '');
  redirect(
    TOOL_TEMPLATE_BY_ID[template]
      ? `/portal/${slug}/library?template=${encodeURIComponent(template)}`
      : `/portal/${slug}/dashboard`,
  );
}

/** Creates a shareable invitation; delivery stays with the workspace owner. */
export async function inviteMember(
  orgId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const role = String(formData.get('role') ?? 'member');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    return { error: 'Enter a valid email.' };
  if (!['admin', 'member', 'viewer'].includes(role))
    return { error: 'Invalid invitation role.' };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_workspace_invitation', {
    p_org: orgId,
    p_email: email,
    p_role: role as 'admin' | 'member' | 'viewer',
  });
  if (error) return { error: error.message };
  revalidatePath('/portal', 'layout');
  return { token: data };
}

export async function acceptInvitation(token: string): Promise<ActionResult> {
  await requireUser(`/invite/${encodeURIComponent(token)}`);
  if (!/^[a-f0-9]{36}$/.test(token)) return { error: 'Invalid invitation.' };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('accept_workspace_invitation', {
    p_token: token,
  });
  if (error) return { error: error.message };
  redirect(`/portal/${data}/dashboard`);
}

export async function revokeInvitation(id: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc('revoke_workspace_invitation', {
    p_id: id,
  });
  if (error) return { error: error.message };
  revalidatePath('/portal', 'layout');
  return {};
}

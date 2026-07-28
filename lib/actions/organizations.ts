'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';
import { assertMemberQuota, getOrgPlan } from '@/lib/auth/entitlements';
import { slugify, randomSuffix } from '@/lib/slug';
import { SITE } from '@/lib/site';
import { normalizeHexColor, normalizeLogoUrl } from '@/lib/branding';
import { recordAudit } from '@/lib/audit';

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
 * Save document branding (owner/admin only, enforced by RLS).
 *
 * Colour and logo are normalised here rather than trusted from the form: these
 * values are embedded into documents that leave the product, so an unparseable
 * colour or a non-https logo is rejected outright instead of being written and
 * silently dropped at render time.
 */
export async function updateBranding(
  orgId: string,
  orgSlug: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();

  const rawColor = String(formData.get('brand_color') ?? '').trim();
  const color = rawColor ? normalizeHexColor(rawColor) : null;
  if (rawColor && !color) {
    return { error: `“${rawColor}” isn’t a valid colour. Use a hex value like #1F5F4E.` };
  }

  const rawLogo = String(formData.get('logo_url') ?? '').trim();
  const logo = rawLogo ? normalizeLogoUrl(rawLogo) : null;
  if (rawLogo && !logo) {
    return { error: 'The logo must be a full https:// image URL.' };
  }

  const text = (key: string) => {
    const v = String(formData.get(key) ?? '').trim();
    return v || null;
  };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organizations')
    .update({
      legal_name: text('legal_name'),
      logo_url: logo,
      brand_color: color,
      confidentiality_label: text('confidentiality_label'),
      document_footer: text('document_footer'),
    })
    .eq('id', orgId)
    .select('id');
  if (error) return { error: error.message };
  // An update blocked by RLS returns success with zero rows, so without this a
  // member would see "Branding saved" while nothing changed.
  if (!data || data.length === 0) {
    return { error: 'You don’t have permission to change this workspace’s branding.' };
  }

  await recordAudit({
    orgId,
    action: 'branding.updated',
    summary: 'Workspace document branding changed.',
    subjectType: 'organization',
    subjectId: orgId,
  });
  revalidatePath(`/portal/${orgSlug}`, 'layout');
  return {};
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

  await recordAudit({
    orgId,
    action: 'member.invited',
    summary: `Invited ${email} as ${role}.`,
    subjectType: 'member',
    subjectId: email,
    metadata: { role },
  });
  revalidatePath('/portal', 'layout');
  return { inviteUrl: `${SITE.url}/invite/${data.token}` };
}


/**
 * Turn the AI assistant on or off for a workspace.
 *
 * Off is a supported configuration, not a degraded one — some organizations
 * cannot send governance data to a third-party model at all, and they are
 * exactly the ones who buy a tool like this. Enforced server-side in
 * lib/ai/governance.ts, not merely hidden in the UI.
 */
export async function updateSeparationOfDuties(
  orgId: string,
  orgSlug: string,
  required: boolean,
): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organizations')
    .update({ require_separation_of_duties: required })
    .eq('id', orgId)
    .select('id');
  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: 'You don\u2019t have permission to change this workspace\u2019s controls.' };
  }

  await recordAudit({
    orgId,
    action: 'settings.updated',
    summary: `Separation of duties ${required ? 'required' : 'no longer required'} on decisions.`,
    subjectType: 'organization',
    subjectId: orgId,
    metadata: { requireSeparationOfDuties: required },
  });

  revalidatePath(`/portal/${orgSlug}`, 'layout');
  return {};
}

export async function updateAiSettings(
  orgId: string,
  orgSlug: string,
  enabled: boolean,
): Promise<ActionResult> {
  await requireUser();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organizations')
    .update({ ai_enabled: enabled })
    .eq('id', orgId)
    .select('id');
  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: 'You don\u2019t have permission to change this workspace\u2019s AI settings.' };
  }

  await recordAudit({
    orgId,
    action: 'settings.updated',
    summary: `AI assistance ${enabled ? 'enabled' : 'disabled'} for this workspace.`,
    subjectType: 'organization',
    subjectId: orgId,
    metadata: { aiEnabled: enabled },
  });

  revalidatePath(`/portal/${orgSlug}`, 'layout');
  return {};
}

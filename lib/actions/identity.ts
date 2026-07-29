'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';
import { getOrgPlan } from '@/lib/auth/entitlements';
import { hasFeature } from '@/lib/plans';
import { recordAudit } from '@/lib/audit';
import { generateScimToken } from '@/lib/scim/protocol';

export interface ActionResult {
  error?: string;
}

/**
 * Enterprise identity configuration: SSO domains and SCIM tokens.
 *
 * Every mutation re-checks the plan on the server. The settings screen hides
 * these controls below Enterprise, but hiding a control is a UI convenience,
 * not a control — the check that counts is this one.
 */
async function assertSsoEntitled(orgId: string): Promise<string | null> {
  const plan = await getOrgPlan(orgId);
  if (plan === null) return 'Workspace not found.';
  if (!hasFeature(plan, 'sso')) {
    return 'SSO and SCIM are available on the Enterprise plan.';
  }
  return null;
}

/** Bare hostname, lowercased. Accepts a pasted URL or an email and extracts it. */
function normalizeDomain(input: string): string | null {
  let v = input.trim().toLowerCase();
  if (!v) return null;
  if (v.includes('@')) v = v.slice(v.lastIndexOf('@') + 1);
  v = v.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
  // A bare label like "northwind" would match nothing and look configured.
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(v)) return null;
  return v;
}

/**
 * Domains that must never be claimed.
 *
 * Claiming a consumer mail provider would admit every one of its users to the
 * workspace on first sign-in. The verification step is meant to prevent this,
 * but a mistake here is unrecoverable for the people affected, so the list is
 * refused outright rather than left to depend on verification working.
 */
const PUBLIC_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'yahoo.com', 'ymail.com', 'icloud.com', 'me.com', 'aol.com', 'proton.me',
  'protonmail.com', 'gmx.com', 'mail.com', 'zoho.com', 'yandex.com', 'qq.com',
]);

export async function addSsoDomain(
  orgId: string,
  orgSlug: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();
  const gate = await assertSsoEntitled(orgId);
  if (gate) return { error: gate };

  const domain = normalizeDomain(String(formData.get('domain') ?? ''));
  if (!domain) return { error: 'Enter a domain like northwind.com.' };
  if (PUBLIC_DOMAINS.has(domain)) {
    return { error: `${domain} is a public mail provider and can’t be claimed as a workspace domain.` };
  }

  const requireScim = formData.get('require_scim') === 'on';
  const role = String(formData.get('default_role') ?? 'member');

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sso_domains')
    .insert({
      org_id: orgId,
      domain,
      default_role: role as never,
      require_scim: requireScim,
    })
    .select('id');

  if (error) {
    if (error.code === '23505') {
      return { error: `${domain} is already claimed by a workspace.` };
    }
    return { error: error.message };
  }
  // A blocked insert returns success with zero rows under RLS.
  if (!data || data.length === 0) {
    return { error: 'You don’t have permission to change this workspace’s identity settings.' };
  }

  await recordAudit({
    orgId,
    action: 'sso.domain_added',
    summary: `SSO domain ${domain} added (${requireScim ? 'SCIM required' : 'domain trust'}).`,
    subjectType: 'organization',
    subjectId: orgId,
    metadata: { domain, defaultRole: role, requireScim },
  });
  revalidatePath(`/portal/${orgSlug}/settings/identity`);
  return {};
}

export async function removeSsoDomain(
  orgId: string,
  orgSlug: string,
  domainId: string,
): Promise<ActionResult> {
  await requireUser();
  const gate = await assertSsoEntitled(orgId);
  if (gate) return { error: gate };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sso_domains')
    .delete()
    .eq('id', domainId)
    .eq('org_id', orgId)
    .select('domain');
  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: 'You don’t have permission to change this workspace’s identity settings.' };
  }

  await recordAudit({
    orgId,
    action: 'sso.domain_removed',
    summary: `SSO domain ${data[0].domain} removed.`,
    subjectType: 'organization',
    subjectId: orgId,
  });
  revalidatePath(`/portal/${orgSlug}/settings/identity`);
  return {};
}

/**
 * Issue a SCIM token. The secret is returned exactly once — it is stored only
 * as a hash, so there is nothing to show again later.
 */
export async function createScimToken(
  orgId: string,
  orgSlug: string,
  formData: FormData,
): Promise<ActionResult & { token?: string }> {
  const user = await requireUser();
  const gate = await assertSsoEntitled(orgId);
  if (gate) return { error: gate };

  const name = String(formData.get('name') ?? '').trim() || 'SCIM token';
  const { token, prefix, hash } = generateScimToken();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('scim_tokens')
    .insert({ org_id: orgId, name, token_prefix: prefix, token_hash: hash, created_by: user.id })
    .select('id');
  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: 'You don’t have permission to issue tokens for this workspace.' };
  }

  await recordAudit({
    orgId,
    action: 'scim.token_created',
    summary: `SCIM token “${name}” issued.`,
    subjectType: 'organization',
    subjectId: orgId,
    metadata: { name, prefix },
  });
  revalidatePath(`/portal/${orgSlug}/settings/identity`);
  return { token };
}

export async function revokeScimToken(
  orgId: string,
  orgSlug: string,
  tokenId: string,
): Promise<ActionResult> {
  await requireUser();
  const gate = await assertSsoEntitled(orgId);
  if (gate) return { error: gate };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('scim_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', tokenId)
    .eq('org_id', orgId)
    .is('revoked_at', null)
    .select('name');
  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: 'That token is already revoked, or you don’t have permission.' };
  }

  await recordAudit({
    orgId,
    action: 'scim.token_revoked',
    summary: `SCIM token “${data[0].name}” revoked.`,
    subjectType: 'organization',
    subjectId: orgId,
  });
  revalidatePath(`/portal/${orgSlug}/settings/identity`);
  return {};
}

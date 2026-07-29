import { requireMembership } from '@/lib/auth/membership';
import { createClient } from '@/lib/supabase/server';
import { canManageOrg } from '@/lib/rbac';
import { hasFeature } from '@/lib/plans';
import { UpgradeGate } from '@/components/portal/UpgradeGate';
import { IdentityClient } from '@/components/portal/IdentityClient';
import { SITE } from '@/lib/site';

export default async function IdentityPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org, role } = await requireMembership(orgSlug);

  if (!hasFeature(org.plan, 'sso')) {
    return (
      <UpgradeGate
        feature="sso"
        plan={org.plan}
        orgSlug={orgSlug}
        description="Let people sign in with your identity provider, and let it create and remove their access here automatically — so an employee who leaves loses access the same day."
      />
    );
  }

  const supabase = await createClient();
  const [{ data: domains }, { data: tokens }, { data: provisioned }] = await Promise.all([
    supabase
      .from('sso_domains')
      .select('id, domain, verified_at, default_role, require_scim, created_at')
      .eq('org_id', org.id)
      .order('created_at'),
    supabase
      .from('scim_tokens')
      .select('id, name, token_prefix, created_at, last_used_at, revoked_at')
      .eq('org_id', org.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('scim_users')
      .select('id, user_name, display_name, active, role, updated_at')
      .eq('org_id', org.id)
      .order('user_name'),
  ]);

  return (
    <IdentityClient
      orgId={org.id}
      orgSlug={orgSlug}
      canManage={canManageOrg(role)}
      scimBaseUrl={`${SITE.url.replace(/\/$/, '')}/api/scim/v2`}
      domains={domains ?? []}
      tokens={tokens ?? []}
      provisioned={provisioned ?? []}
    />
  );
}

export const dynamic = 'force-dynamic';

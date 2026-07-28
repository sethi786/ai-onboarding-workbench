import { requireMembership } from '@/lib/auth/membership';
import { canManageOrg } from '@/lib/rbac';
import { resolveBranding } from '@/lib/branding';
import { Badge } from '@/components/ui/badge';
import { BrandingForm } from '@/components/portal/BrandingForm';
import { AiSettingsForm } from '@/components/portal/AiSettingsForm';
import { aiPolicyFor } from '@/lib/ai/governance';

export default async function OrgSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org, role } = await requireMembership(orgSlug);
  const brand = resolveBranding(org);
  const aiPolicy = await aiPolicyFor(org.id);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 font-semibold">Data &amp; AI controls</h2>
        <AiSettingsForm
          orgId={org.id}
          orgSlug={orgSlug}
          enabled={aiPolicy.enabled}
          configured={aiPolicy.configured}
          canManage={canManageOrg(role)}
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">Document branding</h2>
        <p className="mb-5 mt-1 text-sm text-muted-foreground">
          Every report, evidence pack, and export this workspace generates carries this branding —
          these are documents that go to your reviewers, your auditors, and your customers.
        </p>
        <BrandingForm
          orgId={org.id}
          orgSlug={orgSlug}
          brand={brand}
          disabled={!canManageOrg(role)}
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">Organization</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="Name" value={org.name} />
          <Row label="Workspace slug" value={<span className="font-mono">{org.slug}</span>} />
          <Row label="Your role" value={<Badge tone="electric">{role}</Badge>} />
          <Row label="Plan" value={<Badge tone="neutral">{org.plan}</Badge>} />
          <Row label="Created" value={new Date(org.created_at).toLocaleDateString()} />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

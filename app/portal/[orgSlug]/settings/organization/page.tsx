import { requireMembership } from '@/lib/auth/membership';
import { Badge } from '@/components/ui/badge';

export default async function OrgSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org, role } = await requireMembership(orgSlug);

  return (
    <div className="space-y-4">
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

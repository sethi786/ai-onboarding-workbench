import { requireMembership } from '@/lib/auth/membership';
import { Badge } from '@/components/ui/badge';

export default async function BillingPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org } = await requireMembership(orgSlug);

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <h2 className="font-semibold">Billing</h2>
        <Badge tone="neutral">Coming soon</Badge>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Your workspace is on the <strong className="text-foreground">{org.plan}</strong> plan.
        Subscription management (Stripe) will be available in a future release. The data model
        already reserves the seam (<code className="font-mono text-xs">stripe_customer_id</code>,{' '}
        <code className="font-mono text-xs">plan</code>).
      </p>
    </div>
  );
}

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireMembership } from '@/lib/auth/membership';
import { loadPortfolio } from '@/lib/db/portfolio';
import { PortfolioList } from '@/components/portal/PortfolioList';
import { canEdit } from '@/lib/rbac';
import { evaluationQuota, getPlan } from '@/lib/plans';
import { UpgradeNotice } from '@/components/portal/UpgradeGate';

export default async function EvaluationsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org, role } = await requireMembership(orgSlug);
  const items = await loadPortfolio(org.id, orgSlug);

  // Quota is derived from the rows we already loaded — no extra round trip.
  const quota = evaluationQuota(org.plan, items.length);
  const plan = getPlan(org.plan);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Evaluations</h1>
          <p className="text-sm text-muted-foreground">
            Tools your organization is reviewing for adoption.
            {quota.limit !== null && (
              <span className="ml-1.5 text-muted-foreground/80">
                {quota.used} of {quota.limit} on {plan.name}.
              </span>
            )}
          </p>
        </div>
        {canEdit(role) && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/portal/${orgSlug}/library`}
              className="inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
            >
              From template
            </Link>
            {quota.allowed ? (
              <Link
                href={`/portal/${orgSlug}/evaluations/new`}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-electric px-4 text-sm font-medium text-white hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> New evaluation
              </Link>
            ) : (
              <span
                aria-disabled
                title="You've reached your plan's evaluation limit"
                className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-md bg-muted px-4 text-sm font-medium text-muted-foreground"
              >
                <Plus className="h-4 w-4" /> New evaluation
              </span>
            )}
          </div>
        )}
      </div>

      {!quota.allowed && (
        <div className="mb-6">
          <UpgradeNotice orgSlug={orgSlug}>
            You’ve used all {quota.limit} evaluations on the {plan.name} plan.
            Upgrade for unlimited evaluations, or delete one to free a slot.
          </UpgradeNotice>
        </div>
      )}

      <PortfolioList items={items} orgSlug={orgSlug} />
    </div>
  );
}

export const dynamic = 'force-dynamic';

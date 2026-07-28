import Link from 'next/link';
import { Lock, ArrowRight } from 'lucide-react';
import { FEATURE_LABELS, getPlan, upgradeTargetFor, type FeatureKey } from '@/lib/plans';

/**
 * Shown in place of a feature the current plan does not include. Server-side
 * enforcement still happens in the action layer — this is the explanation, not
 * the control.
 */
export function UpgradeGate({
  feature,
  plan,
  orgSlug,
  description,
}: {
  feature: FeatureKey;
  plan: string;
  orgSlug: string;
  description?: string;
}) {
  const current = getPlan(plan);
  const target = upgradeTargetFor(feature);

  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-muted">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-lg font-semibold tracking-tight">
        {FEATURE_LABELS[feature]} is part of {target.name}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description ??
          `Your workspace is on the ${current.name} plan. Upgrade to ${target.name} to unlock ${FEATURE_LABELS[feature].toLowerCase()}.`}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href={`/portal/${orgSlug}/settings/billing`}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-5 text-sm font-medium text-paper transition-opacity hover:opacity-90"
        >
          View plans <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/pricing"
          className="inline-flex h-10 items-center rounded-lg border border-border px-5 text-sm font-medium transition-colors hover:bg-muted"
        >
          Compare plans
        </Link>
      </div>
    </div>
  );
}

/** Compact inline variant for banners above partially-gated content. */
export function UpgradeNotice({
  children,
  orgSlug,
}: {
  children: React.ReactNode;
  orgSlug: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
      <Lock className="h-4 w-4 shrink-0 text-warning" />
      <span className="flex-1">{children}</span>
      <Link
        href={`/portal/${orgSlug}/settings/billing`}
        className="shrink-0 font-medium text-electric hover:underline"
      >
        Upgrade
      </Link>
    </div>
  );
}

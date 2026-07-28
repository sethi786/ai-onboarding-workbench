import Link from 'next/link';
import { Check, Minus, ArrowRight } from 'lucide-react';
import { requireMembership } from '@/lib/auth/membership';
import { getEvaluationQuota, getMemberQuota } from '@/lib/auth/entitlements';
import { PLANS, FEATURE_LABELS, getPlan, type FeatureKey, type QuotaState } from '@/lib/plans';
import { Badge } from '@/components/ui/badge';

const FEATURE_ORDER: FeatureKey[] = [
  'workflow',
  'evidenceFactory',
  'exports',
  'toolLibrary',
  'approvals',
  'customLenses',
  'sso',
];

function UsageBar({ label, quota }: { label: string; quota: QuotaState }) {
  const pct =
    quota.limit === null ? 0 : Math.min(100, Math.round((quota.used / Math.max(1, quota.limit)) * 100));
  const atLimit = !quota.allowed;

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={atLimit ? 'font-medium text-danger' : 'text-muted-foreground'}>
          {quota.used}
          {quota.limit === null ? ' · unlimited' : ` of ${quota.limit}`}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${atLimit ? 'bg-danger' : 'bg-electric'}`}
          style={{ width: quota.limit === null ? '100%' : `${pct}%` }}
        />
      </div>
      {atLimit && (
        <p className="mt-2 text-xs text-danger">
          You’ve reached this limit. Upgrade or remove an item to add more.
        </p>
      )}
    </div>
  );
}

export default async function BillingPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org } = await requireMembership(orgSlug);

  const current = getPlan(org.plan);
  const evalQuota = await getEvaluationQuota(org.id, org.plan);
  const seatQuota = await getMemberQuota(org.id, org.plan);

  return (
    <div className="space-y-6">
      {/* Current plan + usage */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-semibold">Current plan</h2>
              <Badge tone={current.id === 'free' ? 'neutral' : 'success'}>{current.name}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{current.blurb}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold tracking-tight">{current.price}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <UsageBar label="Evaluations" quota={evalQuota} />
          <UsageBar label="Members" quota={seatQuota} />
        </div>
      </section>

      {/* Plan comparison */}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold">Plans</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            What each plan includes. Your current plan is highlighted.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-4 font-medium text-muted-foreground">Feature</th>
                {Object.values(PLANS).map((p) => (
                  <th
                    key={p.id}
                    className={`p-4 text-center font-semibold ${p.id === current.id ? 'bg-electric/[0.06]' : ''}`}
                  >
                    {p.name}
                    {p.id === current.id && (
                      <span className="mt-0.5 block text-[11px] font-medium text-electric">
                        Current
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="p-4 font-medium">Evaluations</td>
                {Object.values(PLANS).map((p) => (
                  <td
                    key={p.id}
                    className={`p-4 text-center ${p.id === current.id ? 'bg-electric/[0.06]' : ''}`}
                  >
                    {p.maxEvaluations === null ? 'Unlimited' : p.maxEvaluations}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border">
                <td className="p-4 font-medium">Members</td>
                {Object.values(PLANS).map((p) => (
                  <td
                    key={p.id}
                    className={`p-4 text-center ${p.id === current.id ? 'bg-electric/[0.06]' : ''}`}
                  >
                    {p.maxMembers === null ? 'Unlimited' : p.maxMembers}
                  </td>
                ))}
              </tr>
              {FEATURE_ORDER.map((f) => (
                <tr key={f} className="border-b border-border last:border-0">
                  <td className="p-4 font-medium">{FEATURE_LABELS[f]}</td>
                  {Object.values(PLANS).map((p) => (
                    <td
                      key={p.id}
                      className={`p-4 text-center ${p.id === current.id ? 'bg-electric/[0.06]' : ''}`}
                    >
                      {p.features[f] ? (
                        <Check className="mx-auto h-4 w-4 text-electric" />
                      ) : (
                        <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Upgrade — honest about the current state */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold">Change plan</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Self-serve checkout isn’t connected yet — we haven’t wired a payment provider. To change
          your plan today, get in touch and we’ll move your workspace over manually. The entitlement
          system above is live, so limits and features apply as soon as your plan changes.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-5 text-sm font-medium text-paper transition-opacity hover:opacity-90"
          >
            Contact us to upgrade <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-10 items-center rounded-lg border border-border px-5 text-sm font-medium transition-colors hover:bg-muted"
          >
            See pricing
          </Link>
        </div>
      </section>
    </div>
  );
}

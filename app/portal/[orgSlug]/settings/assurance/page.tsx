import { requireMembership } from '@/lib/auth/membership';
import { runAssurance, evidenceLabel } from '@/lib/assurance';
import { Badge } from '@/components/ui/badge';

const STATUS = {
  pass: { tone: 'success', label: 'Passing' },
  warn: { tone: 'warning', label: 'Attention' },
  fail: { tone: 'danger', label: 'Not met' },
} as const;

const EVIDENCE_TONE = {
  verified: 'electric',
  configured: 'trust',
  attested: 'neutral',
} as const;

export default async function AssurancePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org } = await requireMembership(orgSlug);
  const checks = await runAssurance(org.id, org.plan);

  const failing = checks.filter((c) => c.status === 'fail').length;
  const attention = checks.filter((c) => c.status === 'warn').length;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold">Our controls</h2>
          <Badge tone={failing ? 'danger' : attention ? 'warning' : 'success'}>
            {failing
              ? `${failing} not met`
              : attention
                ? `${attention} need attention`
                : 'All passing'}
          </Badge>
        </div>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          We sell &ldquo;your controls, evidenced&rdquo;, so you are entitled to ask the same of us.
          Each row says how it is known: <strong className="text-foreground">verified</strong> means
          tested against the database when you loaded this page,{' '}
          <strong className="text-foreground">configured</strong> means read from your live
          settings, and <strong className="text-foreground">attested</strong> means it is a
          statement we cannot prove from inside the product. Showing all three as identical green
          ticks would be the dishonesty this product exists to catch.
        </p>
      </div>

      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {checks.map((c) => (
          <div key={c.control} className="flex flex-wrap items-start gap-x-4 gap-y-2 p-4">
            <div className="min-w-[240px] flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{c.control}</h3>
                <Badge tone={EVIDENCE_TONE[c.evidence]}>{c.evidence}</Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{c.detail}</p>
              {c.action && (
                <p className="mt-1.5 text-sm">
                  <span className="font-medium">Next:</span>{' '}
                  <span className="text-muted-foreground">{c.action}</span>
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground/80">{evidenceLabel(c.evidence)}</p>
            </div>
            <Badge tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';

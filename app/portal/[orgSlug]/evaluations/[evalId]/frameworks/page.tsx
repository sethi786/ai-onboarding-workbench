import { notFound } from 'next/navigation';
import { requireMembership } from '@/lib/auth/membership';
import { getEvaluation, loadAssessmentMap, rowToProfile } from '@/lib/db/queries';
import { TEAM_LENSES } from '@/workbench/data/teamLenses';
import { allCoverage } from '@/workbench/engine/frameworkCoverage';
import { FRAMEWORK_DISCLAIMER } from '@/workbench/data/frameworks';
import { makeEmptyAssessment } from '@/workbench/types';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScaleIcon } from '@/components/portal/ScaleIcon';

const STATUS_TONE = {
  covered: 'success',
  partial: 'warning',
  open: 'danger',
  'out-of-scope': 'neutral',
} as const;

const STATUS_LABEL = {
  covered: 'Evidenced',
  partial: 'Partly evidenced',
  open: 'Not started',
  'out-of-scope': 'Out of scope',
} as const;

export default async function FrameworksPage({
  params,
}: {
  params: Promise<{ orgSlug: string; evalId: string }>;
}) {
  const { orgSlug, evalId } = await params;
  await requireMembership(orgSlug);
  const row = await getEvaluation(evalId);
  if (!row) notFound();

  const map = await loadAssessmentMap(evalId);
  const profile = rowToProfile(row);
  const coverage = allCoverage(profile, TEAM_LENSES, (id) => map[id] ?? makeEmptyAssessment(id));

  if (coverage.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
        <ScaleIcon className="mx-auto h-7 w-7 text-muted-foreground" />
        <h2 className="mt-3 font-semibold">No AI frameworks apply to this tool</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          The EU AI Act, ISO 42001, and NIST AI RMF govern AI systems. {row.name} isn’t recorded as
          one and has no AI capability enabled, so none of them are in play. Turn on an AI
          capability flag on the Edit tab if that’s wrong.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold">Regulatory mapping</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Where this review already answers each obligation, and where it doesn’t. Built from the
          controls your team assessed — so when a regulator or auditor asks “show me Article 14”,
          the answer is a link rather than a search.
        </p>
      </div>

      <p className="rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-[oklch(0.45_0.09_75)]">
        {FRAMEWORK_DISCLAIMER}
      </p>

      {coverage.map((f) => (
        <section key={f.framework.id} className="rounded-lg border border-border bg-card">
          <header className="border-b border-border p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">{f.framework.name}</h2>
              <span className="font-mono text-xs text-muted-foreground">
                {f.framework.authority}
              </span>
              <div className="ml-auto flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {f.covered} evidenced · {f.partial} partial · {f.open} not started
                </span>
                <div className="w-28">
                  <Progress value={Math.round(f.completeness * 100)} showLabel />
                </div>
              </div>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{f.framework.trigger}</p>
          </header>

          <div className="divide-y divide-border">
            {f.clauses.map((c) => (
              <div key={c.clause.id} className="p-5">
                <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                  <span className="font-mono text-sm font-semibold text-electric">
                    {c.clause.ref}
                  </span>
                  <div className="min-w-[220px] flex-1">
                    <h3 className="font-medium">{c.clause.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">{c.clause.requires}</p>
                  </div>
                  <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                </div>

                {c.contributingLenses.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.contributingLenses.map((l) => (
                      <span
                        key={l.id}
                        className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {l.title} · {Math.round(l.completeness * 100)}%
                      </span>
                    ))}
                  </div>
                )}

                {c.status === 'out-of-scope' && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No review required for this tool evidences this obligation
                    {c.inapplicableLenses.length > 0 && (
                      <> — {c.inapplicableLenses.join(', ')} {c.inapplicableLenses.length === 1 ? 'is' : 'are'} not required here</>
                    )}
                    . If the obligation applies to you, that gap is real and worth closing.
                  </p>
                )}

                {c.openItems.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                      {c.openItems.length} outstanding {c.openItems.length === 1 ? 'item' : 'items'}
                    </summary>
                    <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                      {c.openItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export const dynamic = 'force-dynamic';

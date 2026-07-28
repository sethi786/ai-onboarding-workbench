import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { PageHero } from '@/components/marketing/PageHero';
import { Reveal } from '@/components/motion/Reveal';
import { DEMO } from '@/lib/demo-review';

export const metadata: Metadata = {
  title: 'A finished review, in full',
  description:
    'Read the complete review document Aegis produces — cover page, per-team findings, generated diagrams, and the EU AI Act evidence map — for a real Microsoft 365 Copilot rollout.',
};

/**
 * The deliverable, published in full.
 *
 * Every governance tool claims it produces "audit-ready documentation". Almost
 * none will show you one before you sign up. This page shows the whole thing,
 * built by the same code path a paying customer's export uses.
 */

const CONTENTS = [
  {
    n: '01',
    t: 'Cover page and executive summary',
    d: 'The organization’s branding, the handling marking, the readiness score, the risk grade, and the recommendation — everything a committee chair reads before the meeting.',
  },
  {
    n: '02',
    t: 'Per-team findings',
    d: 'One section per review team that applied, with their score, decision, completed controls, outstanding evidence, and any active blockers.',
  },
  {
    n: '03',
    t: 'Four generated diagrams',
    d: 'Data flow, trust boundary, approval path, and readiness heatmap — inline SVG, drawn from the assessment, so the document prints and travels without any renderer.',
  },
  {
    n: '04',
    t: 'Regulatory evidence maps',
    d: 'EU AI Act, ISO/IEC 42001, and NIST AI RMF, clause by clause, each marked evidenced, partly evidenced, not started, or out of scope for this tool.',
  },
];

export default function ExampleReviewPage() {
  return (
    <>
      <PageHero
        eyebrow="The deliverable"
        title="This is the document you end up with."
        subtitle={`A ${DEMO.score.readiness}/100 readiness review of ${DEMO.toolName}, produced by Aegis for a 240-person pilot. Not a sample we wrote — the actual export, built by the same code that runs in the product.`}
      />

      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <Reveal>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Tool Adoption Review — {DEMO.toolName}
                </h2>
                <p className="mt-1 text-[15px] text-muted-foreground">
                  {DEMO.orgName} · {DEMO.lensesRequired} review teams · {DEMO.score.risk} risk ·{' '}
                  {DEMO.score.recommendation}
                </p>
              </div>
              <a
                href="/example-review/document"
                target="_blank"
                rel="noopener"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-[15px] font-medium transition-colors hover:bg-muted"
              >
                Open full size <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </Reveal>

          <Reveal>
            <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-white shadow-float">
              <iframe
                src="/example-review/document"
                title={`Tool Adoption Review — ${DEMO.toolName}`}
                // Static, self-contained document with no scripts; sandboxed
                // anyway so the frame can never navigate the parent page.
                sandbox=""
                loading="lazy"
                className="h-[78vh] min-h-[560px] w-full border-0"
              />
            </div>
          </Reveal>

          <Reveal>
            <p className="mt-4 text-sm text-muted-foreground">
              Print it and you get a paginated PDF with the cover, the handling marking, and page
              numbers — no export server, no PDF service, nothing that can go down the day before a
              committee meeting.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-border bg-paper">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
          <Reveal>
            <h2 className="display-lg max-w-2xl">What&rsquo;s inside it.</h2>
          </Reveal>
          <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {CONTENTS.map((c, i) => (
              <Reveal key={c.n} index={i % 2}>
                <div className="flex gap-5 border-t border-border pt-5">
                  <div className="font-mono text-sm font-medium text-electric">{c.n}</div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">{c.t}</h3>
                    <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
                      {c.d}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sand">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 sm:py-24">
          <Reveal>
            <h2 className="display-lg">Produce one for your own tool.</h2>
            <p className="mt-5 text-lg text-muted-foreground">
              The free plan takes one tool all the way through — including this document, in your
              branding.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-7 text-[15px] font-medium text-paper transition-transform hover:scale-[1.02]"
              >
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/platform"
                className="inline-flex h-12 items-center rounded-full border border-border bg-card px-7 text-[15px] font-medium transition-colors hover:bg-muted"
              >
                See how it&rsquo;s built
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

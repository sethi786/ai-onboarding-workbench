import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, X, ArrowRight } from 'lucide-react';
import { PageHero } from '@/components/marketing/PageHero';
import { Reveal } from '@/components/motion/Reveal';

export const metadata: Metadata = {
  title: 'Why Aegis',
  description:
    'How Aegis replaces the manual, multi-department tool-approval gauntlet with one evidenced readiness workflow.',
};

const ROWS = [
  { dim: 'Where it lives', manual: 'Email, spreadsheets, and a dozen tickets', aegis: 'One workspace, one record per tool' },
  { dim: 'When Security & Privacy find out', manual: 'Late — often after the business decided', aegis: 'At intake, with complete inputs' },
  { dim: 'Consistency', manual: 'Depends who runs the review', aegis: 'Same lenses, same scoring, every time' },
  { dim: 'Evidence', manual: 'Scattered, rebuilt from scratch each time', aegis: 'Generated packs, prefilled and reusable' },
  { dim: 'Readiness signal', manual: 'A gut feel in someone’s head', aegis: 'A 0–100 score, risk grade, go/no-go' },
  { dim: 'Small teams', manual: 'Skip it, or drown doing it by hand', aegis: 'Guided — no review org required' },
  { dim: 'Audit trail', manual: 'Reconstructed under pressure', aegis: 'Owners, dates, decisions, exportable' },
  { dim: 'Time to a decision', manual: 'Weeks of back-and-forth', aegis: 'A structured review in a fraction of the time' },
];

const STATS = [
  { v: '20', l: 'review lenses, in one workflow' },
  { v: '150+', l: 'controls & evidence items covered' },
  { v: '1', l: 'readiness score leadership can trust' },
];

export default function WhyAegisPage() {
  return (
    <>
      <PageHero
        eyebrow="Why Aegis"
        title="The approval gauntlet, replaced"
        subtitle="Adopting a tool shouldn’t mean weeks of email across Security, Privacy, Legal, Risk, and IT. Aegis runs that whole process as one evidenced workflow — for teams with a review org, and the many without one."
      />

      {/* Comparison */}
      <section className="mx-auto max-w-5xl px-5 py-24 sm:px-8">
        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-[1.1fr_1fr_1fr] bg-ink text-white">
              <div className="p-4 text-[13px] font-semibold sm:p-5" />
              <div className="border-l border-white/10 p-4 text-[13px] font-semibold sm:p-5">
                The manual process
              </div>
              <div className="border-l border-white/10 bg-electric/15 p-4 text-[13px] font-semibold sm:p-5">
                With Aegis
              </div>
            </div>
            {ROWS.map((r, i) => (
              <div
                key={r.dim}
                className={`grid grid-cols-[1.1fr_1fr_1fr] text-[13.5px] ${i % 2 ? 'bg-surface' : 'bg-card'}`}
              >
                <div className="p-4 font-medium sm:p-5">{r.dim}</div>
                <div className="flex items-start gap-2 border-l border-border p-4 text-muted-foreground sm:p-5">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-danger/70" />
                  {r.manual}
                </div>
                <div className="flex items-start gap-2 border-l border-border p-4 sm:p-5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
                  {r.aegis}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Stats band */}
      <section className="border-y border-border bg-sand">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-5 py-16 text-center sm:grid-cols-3 sm:px-8">
          {STATS.map((s) => (
            <Reveal key={s.l}>
              <div>
                <div className="text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">{s.v}</div>
                <div className="mx-auto mt-3 max-w-[18ch] text-sm text-muted-foreground">{s.l}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Narrative */}
      <section className="mx-auto max-w-3xl px-5 py-24 sm:px-8">
        <Reveal>
          <h2 className="display-lg">Governance shouldn’t require a governance department.</h2>
          <div className="mt-6 space-y-5 text-[16px] leading-relaxed text-muted-foreground">
            <p>
              In a large enterprise, a new tool passes through architecture, security, privacy, legal,
              risk, data governance, identity, platform, and finance before it goes live. Each gate is
              reasonable. Together, run over email, they take weeks — and the tool’s risk is only as
              understood as the busiest reviewer’s memory.
            </p>
            <p>
              Smaller companies face the same risk with none of the machinery. There’s no privacy
              office to write the PIA, no security team to run the assessment. So governance gets
              skipped — until a customer’s security questionnaire, an auditor, or an incident makes it
              unavoidable.
            </p>
            <p>
              Aegis encodes that entire review as a guided workflow. It asks the right questions per
              tool, scores the answers the same way every time, drafts the evidence, and tracks the
              approvals — so a two-person startup and a Fortune 500 review board arrive at the same
              defensible decision.
            </p>
          </div>
          <Link
            href="/signup"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-7 text-[15px] font-medium text-paper transition-transform hover:scale-[1.03]"
          >
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </section>
    </>
  );
}

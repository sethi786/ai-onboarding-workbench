import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, Minus } from 'lucide-react';
import { PageHero } from '@/components/marketing/PageHero';
import { Reveal } from '@/components/motion/Reveal';
import { FRAMEWORK_BY_ID, FRAMEWORK_DISCLAIMER } from '@/workbench/data/frameworks';
import { LENS_BY_ID } from '@/workbench/data/teamLenses';

export const metadata: Metadata = {
  title: 'EU AI Act readiness for the tools you adopt',
  description:
    'High-risk obligations apply from August 2026. See which Articles a tool adoption review evidences — Article 9 risk management, Article 14 human oversight, Article 26 deployer duties — and what each one asks of you.',
};

const ACT = FRAMEWORK_BY_ID['eu-ai-act'];
const ISO = FRAMEWORK_BY_ID['iso-42001'];

export default function EuAiActPage() {
  return (
    <>
      <PageHero
        eyebrow="EU AI Act · Regulation (EU) 2024/1689"
        title="You deployed the AI. The obligations are yours too."
        subtitle="Most EU AI Act coverage is written for the companies building AI. If you rolled out Copilot, an AI notetaker, or a support assistant, you are a deployer — and Article 26 lands on you."
      />

      <section className="border-y border-border bg-paper">
        <div className="mx-auto grid max-w-5xl gap-px bg-border sm:grid-cols-3">
          {[
            { n: 'Aug 2026', l: 'high-risk obligations apply' },
            { n: '€35M', l: 'or 7% of global turnover' },
            { n: `${ACT.clauses.length}`, l: 'Articles this review evidences' },
          ].map((s) => (
            <div key={s.l} className="bg-paper px-6 py-8 text-center">
              <div className="text-3xl font-semibold tracking-tight sm:text-4xl">{s.n}</div>
              <div className="mt-1.5 text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
        <Reveal>
          <h2 className="display-lg">The obligation nobody warned you about</h2>
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted-foreground">
            <p>
              Article 26 applies to <strong className="text-foreground">deployers</strong> — anyone
              putting a high-risk AI system into use, including one they bought. It requires you to
              use the system per its instructions, assign human oversight to named people with the
              competence and authority to intervene, ensure input data is relevant to the intended
              purpose, monitor operation, retain logs for at least six months, and inform workers
              before the system is used on them at work.
            </p>
            <p>
              None of that is satisfied by the vendor&rsquo;s compliance. It is satisfied by your
              adoption process — the one that, for most organizations, is a Slack thread and a
              spreadsheet.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="bg-sage">
        <div className="mx-auto max-w-5xl px-5 py-24 sm:px-8">
          <Reveal>
            <h2 className="display-lg">What each Article asks, and what answers it</h2>
            <p className="mt-4 max-w-2xl text-lg text-foreground/70">
              Every review Aegis runs is mapped to the obligation it evidences. When an auditor asks
              where you addressed Article 14, the answer is a control somebody assessed and signed,
              not a search through old documents.
            </p>
          </Reveal>

          <div className="mt-12 overflow-hidden rounded-2xl border border-foreground/10 bg-card">
            {ACT.clauses.map((c) => (
              <div key={c.id} className="border-b border-border p-5 last:border-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-sm font-semibold text-electric">{c.ref}</span>
                  <h3 className="font-semibold">{c.title}</h3>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{c.requires}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {c.lenses.map((id) => (
                    <span
                      key={id}
                      className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {LENS_BY_ID[id]?.title ?? id}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 rounded-xl border border-dashed border-foreground/20 p-5 text-sm text-foreground/70">
            {FRAMEWORK_DISCLAIMER}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-24 sm:px-8">
        <Reveal>
          <h2 className="display-lg">ISO 42001 comes along with it</h2>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            The same review maps to the nine Annex A objectives, so the work you do for the Act is
            most of the work for certification.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ISO.clauses.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs font-semibold text-electric">{c.ref}</span>
                <h3 className="text-sm font-semibold">{c.title}</h3>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{c.requires}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-sand">
        <div className="mx-auto max-w-3xl px-5 py-24 sm:px-8">
          <h2 className="display-lg text-balance">What you get, and what you still owe a lawyer</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-electric">
                Aegis does
              </h3>
              <ul className="mt-3 space-y-2.5 text-[15px]">
                {[
                  'Map every control you assess to the Article it evidences',
                  'Show which obligations your review does not touch',
                  'Generate the branded document with the evidence table in it',
                  'Recalculate as the tool, data, or environment changes',
                ].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Aegis does not
              </h3>
              <ul className="mt-3 space-y-2.5 text-[15px] text-muted-foreground">
                {[
                  'Classify your system as high-risk under Article 6',
                  'Perform or replace a conformity assessment',
                  'Tell you an obligation is met — only where you addressed it',
                  'Substitute for legal advice on your specific deployment',
                ].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <Minus className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Link
            href="/signup"
            className="mt-10 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-7 text-[15px] font-medium text-paper transition-transform hover:scale-[1.02]"
          >
            Map your first AI tool free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

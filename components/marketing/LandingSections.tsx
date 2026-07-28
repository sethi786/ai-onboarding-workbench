'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';

/* --------------------------------------------------------------- Statement band */
export function StatementBand() {
  return (
    <section className="bg-sand">
      <div className="mx-auto max-w-5xl px-5 py-28 text-center sm:px-8 sm:py-36">
        <Reveal>
          <p className="display-lg text-balance">
            The review teams aren&apos;t the enemy.
            <span className="text-muted-foreground">
              {' '}
              Showing up unprepared is. Aegis gets every tool ready before the gates.
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Features
 *
 * Deliberately not a grid of tinted icon cards. Nine equal cells with a lucide
 * glyph in a rounded square is the house style of every generated site, and it
 * flattens nine different claims into one texture — the reader skims all of it
 * and retains none. Here the work is grouped into the three things the product
 * actually does, each with a lead line carrying real weight and its parts set
 * as prose under hairlines. No boxes, no icons, uneven by design.
 */
const CHAPTERS = [
  {
    n: '01',
    lead: 'It works out how much review you owe.',
    body: 'Most of the effort in a tool review is spent on questions that don’t apply to it.',
    points: [
      {
        t: 'Only the reviews in scope',
        d: 'Twenty lenses, scoped to what you’re actually adopting. A CRM never gets pushed through an AI engineering review, and software you don’t host skips the build and hardening lenses.',
      },
      {
        t: 'Depth proportionate to exposure',
        d: 'A sandbox trial answers the make-or-break questions and collects no documents. A production rollout holding personal data answers everything. Same engine, 22 controls against 126.',
      },
      {
        t: 'Every omission defended',
        d: 'Each skipped review states its reason and what would bring it back into scope — derived from the rule itself, so it can’t drift from the decision.',
      },
    ],
  },
  {
    n: '02',
    lead: 'It carries you through the questions.',
    body: 'A checklist you have to interpret is a checklist people guess at.',
    points: [
      {
        t: 'Every control says what done means',
        d: 'Not “secrets vault” but: every credential lives in a secrets manager with a recorded path, and no key appears in config, code, or a spreadsheet. All 332 controls and documents carry one.',
      },
      {
        t: 'The AI drafts the first pass',
        d: 'Paste a vendor page and the intake fills itself in. Each team’s section gets drafted — narrative, open controls, the exact questions to send the vendor. You review and own it; you never start from a blank page.',
      },
      {
        t: 'Scoring you can defend',
        d: 'Evidence sets the ceiling, judgement moves within it, and a critical blocker forces readiness to zero. You cannot score points for work you haven’t done.',
      },
    ],
  },
  {
    n: '03',
    lead: 'It hands you the pack.',
    body: 'The artifact is the point. Everything before it is preparation.',
    points: [
      {
        t: 'A review document in your branding',
        d: 'Your logo, colour, and handling marking, print-ready. What reaches your auditor looks like it came from you, because it did.',
      },
      {
        t: 'Four diagrams that can’t go stale',
        d: 'Data flow, trust boundary, approval path, and readiness heatmap, generated from the evaluation itself — as SVG and as Mermaid you can keep editing.',
      },
      {
        t: 'The regulation, mapped',
        d: 'EU AI Act, ISO 42001, and NIST AI RMF, clause by clause, each marked evidenced, partly evidenced, or out of scope for this tool.',
      },
    ],
  },
];

export function FeatureGrid() {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <Reveal>
          <h2 className="display-lg max-w-2xl">
            Three things, done properly,
            <br className="hidden sm:block" /> instead of thirty done thinly.
          </h2>
        </Reveal>

        <div className="mt-16 space-y-16 sm:mt-20 sm:space-y-24">
          {CHAPTERS.map((c) => (
            <Reveal key={c.n}>
              <div className="grid gap-8 border-t border-foreground/15 pt-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,9fr)] lg:gap-16">
                <div>
                  <div className="font-mono text-[13px] text-muted-foreground">{c.n}</div>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-[30px] font-normal leading-[1.1] tracking-[-0.01em] sm:text-[36px]">
                    {c.lead}
                  </h3>
                  <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
                    {c.body}
                  </p>
                </div>
                <div className="space-y-6">
                  {c.points.map((p) => (
                    <div key={p.t} className="border-t border-border pt-5 first:border-0 first:pt-0">
                      <h4 className="text-[16px] font-semibold tracking-tight">{p.t}</h4>
                      <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                        {p.d}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- How it works */
const STEPS = [
  { n: '01', t: 'Describe the tool', d: 'Paste the vendor page or the request email and the intake fills itself in — or instantiate a prefilled template in one click. What you record decides which reviews apply.' },
  { n: '02', t: 'Work the lenses', d: 'Only the reviews in scope. Controls, evidence, blockers, and a 0–5 score per team — each section drafted for you to check and edit.' },
  { n: '03', t: 'Score and see the gaps', d: 'A readiness number, a risk grade, and a go/no-go call, with hard blockers surfaced and diagrams generated from your answers.' },
  { n: '04', t: 'Hand over the pack', d: 'Branded evidence packs and a print-ready review document, plus drafted answers to whatever the reviewers send back.' },
];

export function HowItWorks() {
  return (
    <section className="bg-sage">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <Reveal>
          <h2 className="display-lg max-w-2xl">From intake to go/no-go in four moves.</h2>
        </Reveal>
        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} index={i % 2}>
              <div className="flex gap-5 border-t border-foreground/10 pt-6">
                <div className="font-mono text-sm font-medium text-electric">{s.n}</div>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight">{s.t}</h3>
                  <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-foreground/70">{s.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- What reviewers ask */
const REVIEWER_QUESTIONS = [
  {
    team: 'Security asks',
    q: 'What can this reach, under whose identity, and how do we revoke it?',
    d: 'Access scope, authentication, secrets handling, and the blast radius if the tool is compromised.',
  },
  {
    team: 'Privacy & Legal ask',
    q: 'Whose data goes in, where does it live, and what did we promise about it?',
    d: 'Personal data in scope, sub-processors, residency, retention, and the contract terms behind them.',
  },
  {
    team: 'Risk & leadership ask',
    q: 'What is the residual exposure, and who is accepting it?',
    d: 'A consistent risk grade, the controls behind it, and a named owner on the decision.',
  },
];

export function ReviewerQuestions() {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <Reveal>
          <h2 className="display-lg max-w-2xl">
            Every review comes down to a handful of questions.
          </h2>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Aegis is organized around what review teams actually press on — so you answer it once,
            with evidence, instead of rediscovering it per tool.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-12 md:grid-cols-3">
          {REVIEWER_QUESTIONS.map((t, i) => (
            <Reveal key={t.team} index={i}>
              <div className="flex h-full flex-col">
                <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                  {t.team}
                </div>
                <p className="mt-3 text-[19px] font-medium leading-snug tracking-[-0.01em]">“{t.q}”</p>
                <p className="mt-4 border-t border-border pt-4 text-[14.5px] leading-relaxed text-muted-foreground">
                  {t.d}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- Pricing */
const PLANS = [
  { name: 'Starter', price: '$0', per: 'free', desc: 'Take one tool all the way through.', cta: 'Start free', highlight: false, features: ['1 evaluation, start to finish', '3 seats — bring your reviewers', 'Prefilled tool library', 'Evidence packs & branded review document', 'Diagrams, workflow, and approvals'] },
  { name: 'Team', price: '$499', per: '/mo', desc: 'For everything after the first one.', cta: 'Start free trial', highlight: true, features: ['Unlimited evaluations', '25 seats and role-based access', 'Multiple workspaces', 'Full adoption history for audits', 'Priority support'] },
  { name: 'Enterprise', price: 'Custom', per: '', desc: 'For regulated orgs at scale.', cta: 'Talk to us', highlight: false, features: ['SSO / SCIM', 'Custom lenses & templates', 'Audit & retention controls', 'Dedicated environment', 'Solution engineering'] },
];

/**
 * `heading={false}` on /pricing, where the page masthead already carries this
 * exact line — it was printing twice, one above the other.
 */
export function Pricing({ heading = true }: { heading?: boolean } = {}) {
  return (
    <section id="pricing" className="border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        {heading && (
          <Reveal>
            <div className="text-center">
              <h2 className="display-lg">Start free. Grow when you do.</h2>
            </div>
          </Reveal>
        )}
        <div className={`grid gap-6 md:grid-cols-3 ${heading ? 'mt-14' : ''}`}>
          {PLANS.map((p, i) => (
            <Reveal key={p.name} index={i}>
              <div
                className={`flex h-full flex-col rounded-2xl p-8 ${
                  p.highlight
                    ? 'bg-ink text-white shadow-float'
                    : 'border border-border bg-card'
                }`}
              >
                {p.highlight && (
                  <span className="mb-4 inline-flex w-fit rounded-full bg-electric px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    Most popular
                  </span>
                )}
                <h3 className={`text-lg font-semibold ${p.highlight ? 'text-white' : ''}`}>{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-5xl font-semibold tracking-[-0.04em]">{p.price}</span>
                  <span className={p.highlight ? 'text-white/60' : 'text-muted-foreground'}>{p.per}</span>
                </div>
                <p className={`mt-3 text-sm ${p.highlight ? 'text-white/70' : 'text-muted-foreground'}`}>{p.desc}</p>
                <ul className="mt-7 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${p.highlight ? 'text-electric-soft' : 'text-electric'}`} />
                      <span className={p.highlight ? 'text-white/85' : ''}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.name === 'Enterprise' ? '/contact' : '/signup'}
                  className={`mt-8 inline-flex h-12 items-center justify-center rounded-full px-5 text-sm font-medium transition-transform hover:scale-[1.02] ${
                    p.highlight ? 'bg-paper text-ink' : 'bg-ink text-paper'
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------- FAQ */
const FAQS = [
  { q: 'Does Aegis replace our formal governance process?', a: 'No. Aegis is a self-evaluation and readiness aid. It helps you prepare evidence and understand what each review team inspects — final decisions always follow your organization’s official approval workflows.' },
  { q: 'How does the scoring work?', a: 'A weighted engine averages your 0–5 self-scores across the lenses required for that tool, discounts for missing controls and evidence, and forces readiness to zero if a critical blocker is active — then produces a risk grade and go/no-go recommendation.' },
  { q: 'What data do you store?', a: 'Only the evaluation content you create, scoped to your organization’s workspace with strict row-level security. You can export or delete it anytime.' },
  { q: 'Can we add our own review lenses?', a: 'The 20 lenses cover the standard enterprise gates. Custom lenses and templates are available on the Enterprise plan.' },
  { q: 'Do you support SSO?', a: 'Yes — SSO and SCIM provisioning are available on the Enterprise plan.' },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-3xl px-5 py-24 sm:px-8 sm:py-32">
        <Reveal>
          <h2 className="display-lg text-center">Questions, answered.</h2>
        </Reveal>
        <div className="mt-12 divide-y divide-border border-y border-border">
          {FAQS.map((f, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className="text-[17px] font-medium tracking-tight">{f.q}</span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 pr-8 text-[15px] leading-relaxed text-muted-foreground">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Final CTA */
export function FinalCTA() {
  return (
    <section className="bg-ink">
      <div className="mx-auto max-w-5xl px-5 py-28 text-center sm:px-8 sm:py-36">
        <h2 className="display-lg text-white">Bring your AI tools to review already cleared.</h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/65">
          Start a readiness evaluation in minutes — from a prefilled library of the major AI tools,
          or bring your own.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-paper px-7 text-[15px] font-medium text-ink transition-transform hover:scale-[1.03]"
          >
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/book"
            className="inline-flex h-12 items-center rounded-full border border-white/20 px-7 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
          >
            Book a demo
          </Link>
        </div>
      </div>
    </section>
  );
}

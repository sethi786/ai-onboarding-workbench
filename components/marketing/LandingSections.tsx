'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanEye,
  GitBranch,
  ShieldCheck,
  Boxes,
  FileCheck2,
  Users,
  ChevronDown,
  Check,
  ArrowRight,
} from 'lucide-react';
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
              Showing up unprepared is. Aegis gets every AI tool ready before the gates.
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Features */
const FEATURES = [
  { icon: ScanEye, t: 'Deep-dive review simulator', d: 'Walk all 20 lenses — Security, Privacy, Legal, Risk, Data Governance, Agent & Connector Governance — with the exact controls and evidence each team inspects.' },
  { icon: GitBranch, t: 'Live readiness scoring', d: 'A weighted engine turns your self-assessment into a 0–100 readiness score, risk grade, and go/no-go call. Critical blockers force it to zero.' },
  { icon: ShieldCheck, t: 'Agent & connector governance', d: 'Purpose-built controls for autonomy, tool permissions, identity, kill switches, OAuth scopes, and DLP — the things that actually fail review.' },
  { icon: FileCheck2, t: 'Evidence Factory', d: 'Generate draft SAR, PIA, architecture, and go/no-go packs from your data — walk into real reviews already prepared.' },
  { icon: Boxes, t: 'Prefilled tool library', d: 'Instantiate the major AI tools as pre-populated evaluations with suggested answers, so you start at 60%, not zero.' },
  { icon: Users, t: 'One tower for every stakeholder', d: 'AI Program, Security, Privacy, Legal, Risk, Platform, and leadership — shared readiness, owners, and blockers in a single view.' },
];

export function FeatureGrid() {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <Reveal>
          <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-electric">
            The platform
          </span>
          <h2 className="display-lg mt-4 max-w-2xl">Everything a review team asks for, prepared in advance.</h2>
        </Reveal>
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.t} index={i % 3}>
              <div className="flex h-full flex-col bg-card p-8">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-electric/10">
                  <f.icon className="h-5 w-5 text-electric" />
                </div>
                <h3 className="mt-5 text-[17px] font-semibold tracking-tight">{f.t}</h3>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted-foreground">{f.d}</p>
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
  { n: '01', t: 'Profile the tool', d: 'Capture platform, data, ownership, and capability flags — or instantiate a prefilled template in one click.' },
  { n: '02', t: 'Self-evaluate', d: 'Walk each lens: the controls, the evidence, the blockers, and a 0–5 readiness score per team.' },
  { n: '03', t: 'Score & simulate', d: 'Get a readiness number, a risk grade, and a go/no-go recommendation — with hard blockers surfaced.' },
  { n: '04', t: 'Generate evidence', d: 'Produce draft SAR, PIA, architecture, and go/no-go packs for the real reviews. Walk in prepared.' },
];

export function HowItWorks() {
  return (
    <section className="bg-sage">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <Reveal>
          <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-electric">
            How it works
          </span>
          <h2 className="display-lg mt-4 max-w-2xl">From intake to go/no-go in four moves.</h2>
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
          <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-electric">
            Built around the real questions
          </span>
          <h2 className="display-lg mt-4 max-w-2xl">
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
  { name: 'Starter', price: '$0', per: 'free', desc: 'For individuals evaluating a tool or two.', cta: 'Start free', highlight: false, features: ['1 workspace', 'Up to 3 evaluations', 'All 20 review lenses', 'Evidence Factory', 'Local exports'] },
  { name: 'Team', price: '$499', per: '/mo', desc: 'For AI program & governance teams.', cta: 'Start free trial', highlight: true, features: ['Unlimited evaluations', 'Roles & multi-tenant workspaces', 'Prefilled tool library', 'Go/No-Go packs & approvals', 'Priority support'] },
  { name: 'Enterprise', price: 'Custom', per: '', desc: 'For regulated orgs at scale.', cta: 'Talk to us', highlight: false, features: ['SSO / SCIM', 'Audit & retention controls', 'Custom lenses & templates', 'Dedicated environment', 'Solution engineering'] },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <Reveal>
          <div className="text-center">
            <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-electric">Pricing</span>
            <h2 className="display-lg mt-4">Start free. Grow when you do.</h2>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
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

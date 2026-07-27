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
import { MagneticButton } from '@/components/motion/MagneticButton';

/* ---------------------------------------------------------------- Features */
const FEATURES = [
  { icon: ScanEye, t: 'Deep-dive review simulator', d: 'Walk all 20 lenses — Security, Privacy, Legal, Risk, Data Gov, Agent & Connector Governance — with the exact controls and evidence each team inspects.' },
  { icon: GitBranch, t: 'Live readiness scoring', d: 'A weighted engine turns your self-assessment into a 0–100 readiness score, risk grade, and go/no-go call. Critical blockers force it to zero.' },
  { icon: ShieldCheck, t: 'Agent & connector governance', d: 'Purpose-built controls for autonomy, tool permissions, identity, kill switches, OAuth scopes, and DLP — the things that fail review.' },
  { icon: FileCheck2, t: 'Evidence Factory', d: 'Generate draft SAR, PIA, architecture, and go/no-go packs from your data — walk into real reviews already prepared.' },
  { icon: Boxes, t: 'Prefilled tool library', d: 'Instantiate the world’s major AI tools as pre-populated evaluations with suggested answers, so you start at 60%, not zero.' },
  { icon: Users, t: 'Built for every stakeholder', d: 'One control tower for AI Program, Security, Privacy, Legal, Risk, Platform, and leadership — shared readiness, owners, and blockers.' },
];

export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <Reveal>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-electric">Why Aegis</span>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything you need to clear AI for the enterprise
        </h2>
      </Reveal>
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.t} index={i % 3}>
            <motion.div
              whileHover={{ y: -4 }}
              className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-electric/10">
                <f.icon className="h-5 w-5 text-electric" />
              </div>
              <h3 className="mt-4 font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- How it works */
const STEPS = [
  { n: '01', t: 'Profile the tool', d: 'Capture platform, data, ownership, and capability flags — or instantiate a prefilled template.' },
  { n: '02', t: 'Self-evaluate', d: 'Walk each lens: controls, evidence, blockers, and a 0–5 readiness score.' },
  { n: '03', t: 'Score & simulate', d: 'Get readiness, a risk grade, and a go/no-go recommendation with hard blockers.' },
  { n: '04', t: 'Generate evidence', d: 'Produce draft SAR, PIA, architecture, and go/no-go packs for the real reviews.' },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-navy-deep py-20 text-white">
      <div className="bg-grid radial-fade absolute inset-0 opacity-30" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-electric-soft">How it works</span>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            From intake to go/no-go in four moves
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} index={i}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="font-mono text-sm text-electric">{s.n}</div>
                <h3 className="mt-3 font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-slate-400">{s.d}</p>
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
    <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <Reveal>
        <div className="text-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-electric">Pricing</span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Simple, transparent plans</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Start free. Upgrade when your AI footprint grows.</p>
        </div>
      </Reveal>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {PLANS.map((p, i) => (
          <Reveal key={p.name} index={i}>
            <div
              className={`flex h-full flex-col rounded-2xl border p-7 ${
                p.highlight ? 'border-electric bg-card shadow-lg ring-1 ring-electric/20' : 'border-border bg-card'
              }`}
            >
              {p.highlight && (
                <span className="mb-3 inline-flex w-fit rounded-full bg-electric/10 px-2.5 py-0.5 text-xs font-semibold text-electric">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.per}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-trust" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                href={p.name === 'Enterprise' ? '/contact' : '/signup'}
                className={`mt-7 inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold transition-opacity hover:opacity-90 ${
                  p.highlight ? 'bg-electric text-white' : 'border border-border bg-background text-foreground'
                }`}
              >
                {p.cta}
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- Testimonials */
const QUOTES = [
  { q: 'We used to discover Security and Privacy requirements the week before launch. Now every AI tool arrives at review already prepared.', a: 'Director, AI Program', c: 'Global bank' },
  { q: 'The go/no-go pack alone saved us weeks. Leadership finally has one readiness number they trust.', a: 'CISO', c: 'Health insurer' },
  { q: 'Agent governance was a black box. Aegis turned it into a checklist our engineers actually follow.', a: 'Head of Platform', c: 'Gov contractor' },
];

export function Testimonials() {
  return (
    <section className="border-y border-border bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {QUOTES.map((t, i) => (
            <Reveal key={i} index={i}>
              <figure className="h-full rounded-2xl border border-border bg-card p-6">
                <blockquote className="text-[15px] leading-relaxed">“{t.q}”</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold">{t.a}</span>
                  <span className="text-muted-foreground"> · {t.c}</span>
                </figcaption>
              </figure>
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
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <Reveal>
        <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">Frequently asked</h2>
      </Reveal>
      <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card">
        {FAQS.map((f, i) => (
          <div key={i}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
            >
              <span className="font-medium">{f.q}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open === i ? 'rotate-180' : ''}`} />
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
                  <p className="px-5 pb-5 text-sm text-muted-foreground">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Final CTA */
export function FinalCTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-navy-deep px-6 py-20 text-center text-white">
        <div className="bg-grid radial-fade absolute inset-0 opacity-20" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-electric/20 blur-[100px]" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Bring your AI tools to review already cleared.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            Start a readiness evaluation in minutes — from a prefilled library of the world’s major AI
            tools, or bring your own.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <MagneticButton
              href="/signup"
              className="glow-electric inline-flex h-12 items-center gap-2 rounded-lg bg-electric px-7 text-[15px] font-semibold text-white hover:opacity-90"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </MagneticButton>
            <Link
              href="/book"
              className="inline-flex h-12 items-center rounded-lg border border-white/15 bg-white/5 px-7 text-[15px] font-medium text-white hover:bg-white/10"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

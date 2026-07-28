import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ScanEye,
  Gauge,
  Bot,
  FileCheck2,
  Boxes,
  GitBranch,
  ArrowRight,
  Check,
} from 'lucide-react';
import { PageHero } from '@/components/marketing/PageHero';
import { Reveal } from '@/components/motion/Reveal';
import { ProductPreview } from '@/components/marketing/ProductPreview';

export const metadata: Metadata = { title: 'Product' };

const CAPABILITIES = [
  { icon: ScanEye, t: 'Deep-dive review simulator', d: 'Walk all 20 lenses with the exact controls, evidence, and blockers each enterprise review team inspects.' },
  { icon: Gauge, t: 'Live readiness scoring', d: 'A weighted engine turns self-assessment into a 0–100 score, risk grade, and go/no-go call in real time.' },
  { icon: Bot, t: 'Agent & connector governance', d: 'Autonomy, tool permissions, identity, kill switches, OAuth scopes, and DLP — modeled as first-class controls.' },
  { icon: FileCheck2, t: 'Evidence Factory', d: 'Generate draft SAR, PIA, architecture, and go/no-go packs directly from your assessment data.' },
  { icon: Boxes, t: 'Prefilled tool library', d: 'Instantiate ChatGPT, Copilot, Claude, Bedrock and more as pre-populated evaluations with suggested answers.' },
  { icon: GitBranch, t: 'Workflow & approvals', d: 'Track the 25-stage onboarding lifecycle from intake to retirement with owners, due dates, and sign-offs.' },
];

const OUTCOMES = [
  'One readiness number leadership trusts',
  'Evidence prepared before formal review',
  'Blockers surfaced early, not at launch',
  'Consistent governance across every AI tool',
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="The platform"
        title="Everything you need to clear AI for the enterprise"
        subtitle="Aegis turns opaque, multi-team review into a structured, evidence-backed readiness workflow — from first intake to go-live."
      />

      {/* Product shot */}
      <section className="bg-paper pb-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="shadow-float rounded-2xl">
            <ProductPreview />
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c, i) => (
            <Reveal key={c.t} index={i % 3}>
              <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-electric/10">
                  <c.icon className="h-5 w-5 text-electric" />
                </div>
                <h3 className="mt-4 font-semibold">{c.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Outcomes band */}
      <section className="border-y border-border bg-muted/30 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-electric">Outcomes</span>
              <h2 className="display-md mt-3">
                Onboard AI boldly — and safely
              </h2>
              <p className="mt-4 max-w-md text-muted-foreground">
                Aegis gives every stakeholder a shared, evidence-backed view of readiness, so AI tools
                reach production faster with governance built in.
              </p>
              <Link
                href="/signup"
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-electric px-5 text-sm font-semibold text-white hover:opacity-90"
              >
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
          <Reveal index={1}>
            <div className="grid gap-3">
              {OUTCOMES.map((o) => (
                <div key={o} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-trust/15">
                    <Check className="h-3.5 w-3.5 text-trust" />
                  </span>
                  <span className="text-sm font-medium">{o}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

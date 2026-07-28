import type { Metadata } from 'next';
import Link from 'next/link';
import { Gauge, Layers, FileCheck2, GitBranch, Boxes, LayoutDashboard, ArrowRight } from 'lucide-react';
import { PageHero } from '@/components/marketing/PageHero';
import { Reveal } from '@/components/motion/Reveal';
import { ProductPreview } from '@/components/marketing/ProductPreview';

export const metadata: Metadata = {
  title: 'Platform',
  description:
    'The Aegis platform: readiness engine, 20 review lenses, evidence factory, workflow & approvals, tool library, and a governance control tower.',
};

const MODULES = [
  {
    id: 'engine',
    icon: Gauge,
    eyebrow: 'Readiness Engine',
    title: 'A single score for a months-long decision',
    body: 'A weighted engine turns each self-assessment into a 0–100 readiness score, a Low→Critical risk grade, and a go/no-go recommendation. Complete the required controls and evidence and the score climbs; a single critical blocker forces it to zero. It’s the same math for every tool, so decisions are consistent and defensible.',
    points: ['0–100 readiness score', 'Low → Critical risk grade', 'Go / conditional / no-go call', 'Hard blockers override the score'],
  },
  {
    id: 'lenses',
    icon: Layers,
    eyebrow: '20 Review Lenses',
    title: 'Every department’s review, in one place',
    body: 'Each lens mirrors a real review team — Architecture, Security, Privacy, Legal, Risk, Data Governance, Identity, Platform, Agent Governance, and more. For every lens you get the purpose, the checklist, the required controls, the evidence, and the criteria that pass, condition, or block. Only the lenses a tool actually needs are required.',
    points: ['Purpose, scope & checklist per lens', 'Required controls & evidence', 'Pass / conditional / blocker criteria', 'Auto-scoped to each tool profile'],
  },
  {
    id: 'evidence',
    icon: FileCheck2,
    eyebrow: 'Evidence Factory',
    title: 'Walk into review already prepared',
    body: 'Generate draft Security Assessment Reports, Privacy Impact Assessments, architecture summaries, and go/no-go packs directly from your assessment data. Every artifact is clearly marked as a draft for official review — a starting point that saves days, not a rubber stamp.',
    points: ['Draft SAR, PIA & architecture packs', 'Go/no-go decision pack', 'Prefilled from your assessment', 'Marked “Draft — requires official review”'],
  },
  {
    id: 'workflow',
    icon: GitBranch,
    eyebrow: 'Workflow & Approvals',
    title: 'From intake to retirement, tracked',
    body: 'A 25-stage onboarding lifecycle takes each tool from first intake through pilot, review, approval, go-live, and eventual retirement — with owners, due dates, and sign-offs at every gate. No more lost email threads or “who’s blocking this?”',
    points: ['25-stage lifecycle', 'Owners & due dates', 'Approval sign-offs', 'Full decision history'],
  },
  {
    id: 'library',
    icon: Boxes,
    eyebrow: 'Tool Library',
    title: 'Start at 60%, not zero',
    body: 'Instantiate common tools — SaaS apps, cloud platforms, and AI tools — as pre-populated evaluations with suggested answers and the right lenses already selected. Clone, adjust to your context, and you’re most of the way through the review before you start.',
    points: ['Prefilled SaaS, PaaS & AI templates', 'Suggested answers & lenses', 'Clone and customize', 'Your own reusable templates'],
  },
  {
    id: 'tower',
    icon: LayoutDashboard,
    eyebrow: 'Governance Control Tower',
    title: 'The whole portfolio at a glance',
    body: 'One dashboard shows every tool in flight, its readiness, its risk, and its blockers — for the AI program, Security, Privacy, Legal, Risk, Platform, and leadership. Shared truth instead of a dozen spreadsheets.',
    points: ['Portfolio readiness view', 'Risk & blocker rollups', 'Role-based access', 'Leadership-ready reporting'],
  },
];

export default function PlatformPage() {
  return (
    <>
      <PageHero
        eyebrow="The platform"
        title="Everything you need to clear a tool for production"
        subtitle="Aegis is one connected workflow — from the readiness score to the evidence packs to the approvals — that replaces a scattered, multi-department review process."
      />

      {/* Product shot */}
      <section className="bg-paper pb-8">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="shadow-float rounded-2xl">
            <ProductPreview />
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="space-y-6">
          {MODULES.map((m, i) => (
            <Reveal key={m.id} index={i % 2}>
              <div
                id={m.id}
                className="grid scroll-mt-24 gap-8 rounded-2xl border border-border bg-card p-8 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:items-center"
              >
                <div>
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-electric/10">
                    <m.icon className="h-5 w-5 text-electric" />
                  </div>
                  <span className="mt-5 block text-[12px] font-semibold uppercase tracking-[0.16em] text-electric">
                    {m.eyebrow}
                  </span>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[28px]">{m.title}</h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{m.body}</p>
                </div>
                <ul className="grid gap-3">
                  {m.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 text-[14.5px] font-medium"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-electric" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-ink px-8 py-10 sm:px-10">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">See it run on your stack</h2>
            <p className="mt-2 text-white/65">Start free, or watch the readiness engine score a live example.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-paper px-7 text-[15px] font-medium text-ink transition-transform hover:scale-[1.03]"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#demo"
              className="inline-flex h-12 items-center rounded-full border border-white/20 px-7 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
            >
              Try the live demo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

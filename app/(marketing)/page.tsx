import Link from 'next/link';
import {
  ShieldCheck,
  Boxes,
  ScanEye,
  FileCheck2,
  GitBranch,
  Users,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const controlTower = [
  { name: 'ChatGPT Enterprise', status: 'Cleared', tone: 'trust' as const },
  { name: 'Microsoft 365 Copilot', status: 'Cleared', tone: 'trust' as const },
  { name: 'Claude Enterprise', status: 'In review', tone: 'electric' as const },
  { name: 'Copilot Studio Agent', status: 'Conditions', tone: 'warning' as const },
  { name: 'Bedrock Case Bot', status: 'Blocked', tone: 'danger' as const },
];

const lenses = [
  'Business', 'AI Program', 'Enterprise Arch.', 'Solution Arch.', 'Security / SAR',
  'Privacy / PIA', 'Legal / OGC', 'QRM / Risk', 'Data Governance', 'IAM',
  'Platform / Cloud', 'Secure SDLC', 'AI Engineering', 'Agent Gov.', 'Connector Gov.',
  'Operations', 'Adoption', 'Vendor Risk', 'Finance', 'Go / No-Go',
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy-deep text-white">
        <div className="bg-grid radial-fade absolute inset-0 opacity-70" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-electric-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-trust" /> AI Governance · Readiness · Clearance
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Get AI tools <span className="text-gradient">cleared</span> for the enterprise.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              Clearance AI is the readiness platform for onboarding ChatGPT Enterprise, Copilot,
              Claude, AI agents, RAG apps, and connectors — preparing architecture, security, privacy,
              legal, risk, and go/no-go evidence <em>before</em> formal review.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/signup"
                className="glow-electric inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-electric px-6 text-[15px] font-medium text-white transition-opacity hover:opacity-90 sm:w-auto"
              >
                Start a readiness evaluation <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/assessment"
                className="inline-flex h-11 w-full items-center justify-center rounded-md border border-white/15 bg-white/5 px-6 text-[15px] font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                See the 20 review lenses
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
              {['SOC 2 aligned', 'HIPAA-ready', 'NIST AI RMF', 'FedRAMP-aligned'].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-trust" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Control tower panel */}
          <div className="relative">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  ● Governance Control Tower
                </span>
                <ScanEye className="h-4 w-4 text-slate-500" />
              </div>
              <div className="mt-3 space-y-2">
                {controlTower.map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-3 py-2.5"
                  >
                    <span className="flex items-center gap-2 text-sm text-slate-200">
                      <Boxes className="h-4 w-4 text-electric" /> {row.name}
                    </span>
                    <Badge tone={row.tone} className="font-mono text-[10px] uppercase">
                      {row.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-center">
                <div>
                  <div className="text-xl font-semibold">20</div>
                  <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500">Lenses</div>
                </div>
                <div>
                  <div className="text-xl font-semibold">78</div>
                  <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500">Readiness</div>
                </div>
                <div>
                  <div className="text-xl font-semibold text-trust">B+</div>
                  <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500">Risk grade</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Built for regulated sectors
          </span>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm font-medium text-muted-foreground">
            {['Finance', 'Healthcare', 'Insurance', 'Government', 'Legal', 'Cybersecurity'].map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <Section eyebrow="The problem" title="Every AI tool stalls at the same gates">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: ScanEye,
              t: 'Reviews are a black box',
              d: 'Teams don’t know what Security, Privacy, Legal, or Risk will actually inspect — so evidence arrives late and incomplete.',
            },
            {
              icon: GitBranch,
              t: 'No shared readiness signal',
              d: 'Leadership can’t see whether a tool is 40% or 90% ready, what’s blocking it, or who owns the gap.',
            },
            {
              icon: ShieldCheck,
              t: 'Agents & connectors raise the bar',
              d: 'Autonomy, tool permissions, and data connectors add controls most teams discover only when they fail review.',
            },
          ].map((c) => (
            <div key={c.t} className="rounded-lg border border-border bg-card p-6">
              <c.icon className="h-6 w-6 text-electric" />
              <h3 className="mt-4 text-base font-semibold">{c.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <section className="bg-navy-deep text-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <Eyebrow tone="dark">How Clearance AI works</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">
            A deep-dive review simulator across 20 enterprise lenses
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              { n: '01', t: 'Profile the tool', d: 'Capture platform, data, ownership, and capability flags — or instantiate a prefilled template.' },
              { n: '02', t: 'Self-evaluate', d: 'Walk each lens: controls, evidence, blockers, and a 0–5 readiness score.' },
              { n: '03', t: 'Score & simulate', d: 'Get readiness 0–100, a risk grade, and a go/no-go recommendation with hard blockers.' },
              { n: '04', t: 'Generate evidence', d: 'Produce draft SAR, PIA, architecture, and go/no-go packs to walk into real reviews.' },
            ].map((s) => (
              <div key={s.n} className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
                <div className="font-mono text-sm text-electric">{s.n}</div>
                <h3 className="mt-3 font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-slate-400">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-2">
            {lenses.map((l) => (
              <span
                key={l}
                className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] text-slate-300"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* WHO WE HELP */}
      <Section eyebrow="Who it's for" title="One readiness platform, every stakeholder">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, t: 'AI Program & Enablement', d: 'Track the AI footprint and route intake through governance.' },
            { icon: ShieldCheck, t: 'Security & Privacy', d: 'Pre-stage SAR and PIA evidence; catch blockers early.' },
            { icon: FileCheck2, t: 'Risk, Legal & QRM', d: 'Residual-risk acceptance, client-data restrictions, sign-offs.' },
            { icon: Boxes, t: 'Platform & Engineering', d: 'Agent governance, connector scopes, secure SDLC, evaluation.' },
          ].map((c) => (
            <div key={c.t} className="rounded-lg border border-border bg-card p-6">
              <c.icon className="h-6 w-6 text-electric" />
              <h3 className="mt-4 text-base font-semibold">{c.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* LEAD MAGNET / CTA */}
      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="glow-electric overflow-hidden rounded-2xl bg-navy-deep px-8 py-14 text-center text-white">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight">
              Bring your AI tools to review already cleared.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-300">
              Start a readiness evaluation in minutes with a prefilled library of the world’s major AI
              tools — or bring your own.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-electric px-6 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
              >
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/book"
                className="inline-flex h-11 items-center rounded-md border border-white/15 bg-white/5 px-6 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
              >
                Book a demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Eyebrow({ children, tone = 'light' }: { children: React.ReactNode; tone?: 'light' | 'dark' }) {
  return (
    <span
      className={
        'font-mono text-[11px] uppercase tracking-[0.14em] ' +
        (tone === 'dark' ? 'text-electric-soft' : 'text-electric')
      }
    >
      {children}
    </span>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-10">{children}</div>
    </section>
  );
}

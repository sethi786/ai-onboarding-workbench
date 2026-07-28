import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageHero } from '@/components/marketing/PageHero';
import { Reveal } from '@/components/motion/Reveal';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Why Aegis exists: governance rigor for adopting any tool, without requiring a governance department.',
};

const PRINCIPLES = [
  {
    t: 'Say what is actually true',
    d: 'We label draft artifacts as drafts, state our compliance posture as aligned rather than certified, and don’t publish customer quotes we don’t have. A governance product that overstates its own position has no standing to ask for rigor from anyone else.',
  },
  {
    t: 'The fast path should be the compliant path',
    d: 'People route around governance when it’s slow. The only durable fix is making the reviewed path quicker than the workaround — prefilled templates, generated evidence, and review scoped to real risk.',
  },
  {
    t: 'Scope review to the actual risk',
    d: 'A standalone note-taking app should not face the same gauntlet as an autonomous agent with production credentials. Uniform process across wildly different risk is how organizations end up slow and unsafe at once.',
  },
  {
    t: 'A decision needs a name on it',
    d: 'Risk accepted by a committee is risk accepted by nobody. Every decision Aegis records has a person, a basis, conditions, and a date to revisit.',
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="Governance shouldn’t require a governance department"
        subtitle="Aegis exists because the process that decides whether a company can safely adopt a tool is, almost everywhere, run on email and memory."
      />

      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
        <Reveal>
          <div className="space-y-5 text-[17px] leading-[1.75] text-foreground/85">
            <p className="text-[19px] leading-[1.7] text-foreground">
              In a large enterprise, adopting a new tool means passing architecture, security,
              privacy, legal, risk, data governance, identity, platform, and finance review. Each
              gate exists for a good reason. Run over email, together they take a quarter — and the
              organization’s understanding of the tool’s risk ends up living in the memory of
              whichever reviewer was least busy.
            </p>
            <p>
              Smaller companies face the same risk with none of the machinery. There’s no privacy
              office to write the assessment, no security team to scope the access grant. So
              governance gets skipped — until a customer’s security questionnaire, an auditor, or an
              incident makes it unavoidable, usually at the worst possible moment.
            </p>
            <p>
              Both failures have the same root cause: the review process is undocumented and
              non-repeatable. It lives in people rather than in a system. Aegis encodes it — the
              lenses each team applies, the controls they check, the evidence they need, and the
              decision they ultimately have to record — as one guided workflow that runs the same way
              every time.
            </p>
            <p>
              It applies to any tool: SaaS applications, cloud platforms, on-prem software, and AI
              systems. AI is where the need is most acute right now, because autonomy and data access
              raise questions traditional checklists were never written to ask. But the underlying
              problem is older than AI, and so is the fix.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Principles */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-5xl px-5 py-24 sm:px-8">
          <Reveal>
            <h2 className="display-lg">How we build it</h2>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.t} index={i % 2}>
                <div className="h-full rounded-2xl border border-border bg-card p-7">
                  <h3 className="text-[17px] font-semibold tracking-tight">{p.t}</h3>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">{p.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Honest status */}
      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
        <Reveal>
          <div className="rounded-2xl border border-border bg-card p-8">
            <h2 className="text-xl font-semibold tracking-tight">Where we are today</h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
              Aegis is early. The readiness engine, the twenty review lenses, the evidence factory,
              and the approval workflow all work today. We’re building in the open with early users
              rather than publishing logos and quotes we haven’t earned. If you want to know exactly
              what’s production-ready and what’s still in progress before you commit, ask us — we’ll
              tell you straight.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-medium text-paper transition-transform hover:scale-[1.02]"
              >
                Talk to us <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium transition-colors hover:bg-muted"
              >
                Start free
              </Link>
            </div>
          </div>
          <p className="mt-8 rounded-xl border border-border bg-surface p-5 text-sm leading-relaxed text-muted-foreground">
            Aegis is a self-evaluation and readiness aid. It does not replace official enterprise
            approval workflows. Final decisions follow your organization’s formal governance
            processes.
          </p>
        </Reveal>
      </section>
    </>
  );
}

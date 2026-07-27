import type { Metadata } from 'next';
import { PageHero } from '@/components/marketing/PageHero';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="Readiness, not roadblocks"
        subtitle="We believe enterprises should adopt AI boldly — and safely. Aegis makes the path through governance legible."
      />
      <section className="mx-auto max-w-3xl px-6 py-16 text-[15px] leading-relaxed text-muted-foreground">
        <p>
          Every organization wants the productivity of ChatGPT Enterprise, Copilot, Claude, and AI
          agents. But in regulated industries, each tool must pass architecture, security, privacy,
          legal, risk, data governance, and go/no-go review before it reaches production. Those reviews
          are rigorous for good reason — and, too often, a black box to the teams trying to pass them.
        </p>
        <p className="mt-4">
          Aegis turns that black box into a structured, evidence-backed readiness workflow.
          Teams self-evaluate against the same 20 lenses real reviewers use, see exactly what each
          area inspects, generate draft evidence, and walk into formal review already prepared.
        </p>
        <p className="mt-4">
          The result: faster, more confident AI adoption — with governance built in from day one, not
          bolted on after a failed review.
        </p>
        <div className="mt-8 rounded-lg border border-border bg-muted/40 p-5 text-sm">
          Aegis is a self-evaluation and readiness aid. It does not replace official enterprise
          approval workflows. Final decisions follow your organization’s formal governance processes.
        </div>
      </section>
    </>
  );
}

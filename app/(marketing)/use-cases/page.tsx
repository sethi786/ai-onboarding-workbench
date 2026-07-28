import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageHero } from '@/components/marketing/PageHero';
import { Reveal } from '@/components/motion/Reveal';
import { PROBLEMS } from '@/lib/problems';

export const metadata: Metadata = {
  title: 'Use cases',
  description:
    'The specific problems teams bring to Aegis — security questionnaires, shadow AI, stalled approvals, audit prep, vendor access, AI rollouts, and diligence.',
};

export default function UseCasesPage() {
  return (
    <>
      <PageHero
        eyebrow="Use cases"
        title="Find the problem you actually have"
        subtitle="Nobody wakes up wanting a governance workflow. They wake up with a questionnaire due, a blocked tool, or an auditor asking questions. Start there."
      />
      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          {PROBLEMS.map((p, i) => (
            <Reveal key={p.slug} index={i % 2}>
              <Link
                href={`/use-cases/${p.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-border bg-card p-7 transition-colors hover:border-electric/40 hover:bg-muted/30"
              >
                <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                  {p.who}
                </span>
                <p className="mt-3 text-[17px] font-medium leading-snug">“{p.trigger}”</p>
                <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-muted-foreground">
                  {p.subtitle}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-electric">
                  See how this works
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageHero } from '@/components/marketing/PageHero';
import { Reveal } from '@/components/motion/Reveal';
import { SOLUTIONS, SOLUTION_GROUPS } from '@/lib/solutions';

export const metadata: Metadata = {
  title: 'Solutions',
  description: 'Govern the adoption of any tool — by tool type, by team, and by company size.',
};

export default function SolutionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Solutions"
        title="One governance workflow. Every kind of tool."
        subtitle="Whether it’s a SaaS app, a cloud platform, on-prem software, or an AI agent — and whichever team or company size you are — Aegis runs the same rigorous review."
      />
      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
        {SOLUTION_GROUPS.map((group, gi) => (
          <div key={group} className={gi > 0 ? 'mt-20' : ''}>
            <Reveal>
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-electric">{group}</h2>
            </Reveal>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {SOLUTIONS.filter((s) => s.group === group).map((s, i) => (
                <Reveal key={s.slug} index={i % 2}>
                  <Link
                    href={`/solutions/${s.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-border bg-card p-7 transition-colors hover:border-electric/40 hover:bg-muted/30"
                  >
                    <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                      {s.eyebrow}
                    </span>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight">{s.title}</h3>
                    <p className="mt-2.5 flex-1 text-[14.5px] leading-relaxed text-muted-foreground">
                      {s.subtitle}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-electric">
                      Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

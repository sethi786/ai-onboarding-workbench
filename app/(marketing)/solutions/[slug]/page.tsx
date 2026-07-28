import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, ArrowLeft } from 'lucide-react';
import { PageHero } from '@/components/marketing/PageHero';
import { Reveal } from '@/components/motion/Reveal';
import { SOLUTIONS, SOLUTION_BY_SLUG } from '@/lib/solutions';

export function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = SOLUTION_BY_SLUG[slug];
  if (!s) return { title: 'Solution' };
  return { title: s.title, description: s.subtitle };
}

export default async function SolutionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = SOLUTION_BY_SLUG[slug];
  if (!s) notFound();

  return (
    <>
      <PageHero eyebrow={s.eyebrow} title={s.title} subtitle={s.subtitle} />

      {/* The problem */}
      <section className="bg-sand">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8">
          <Reveal>
            <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-electric">
              The problem today
            </span>
            <p className="mt-4 text-2xl font-medium leading-snug tracking-tight sm:text-[28px]">
              {s.problem}
            </p>
          </Reveal>
        </div>
      </section>

      {/* How Aegis helps */}
      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <Reveal>
          <h2 className="display-lg max-w-2xl">How Aegis handles it</h2>
        </Reveal>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
          {s.points.map((p, i) => (
            <Reveal key={p.t} index={i % 3}>
              <div className="flex h-full flex-col bg-card p-7">
                <div className="font-mono text-sm text-electric">{String(i + 1).padStart(2, '0')}</div>
                <h3 className="mt-3 text-[17px] font-semibold tracking-tight">{p.t}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{p.d}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Relevant lenses */}
        <div className="mt-14 rounded-2xl border border-border bg-surface p-8">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
            Review lenses applied
          </h3>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {s.lenses.map((l) => (
              <span
                key={l}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] font-medium"
              >
                <Check className="h-3.5 w-3.5 text-electric" /> {l}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Outcome + CTA */}
      <section className="bg-ink">
        <div className="mx-auto max-w-4xl px-5 py-24 text-center sm:px-8">
          <p className="display-lg text-white">{s.outcome}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-paper px-7 text-[15px] font-medium text-ink transition-transform hover:scale-[1.03]"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/solutions"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-7 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" /> All solutions
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

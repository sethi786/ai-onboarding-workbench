import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import { PageHero } from '@/components/marketing/PageHero';
import { Reveal } from '@/components/motion/Reveal';
import { PROBLEMS, PROBLEM_BY_SLUG } from '@/lib/problems';

export function generateStaticParams() {
  return PROBLEMS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = PROBLEM_BY_SLUG[slug];
  if (!p) return { title: 'Use case' };
  return { title: p.trigger, description: p.subtitle };
}

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PROBLEM_BY_SLUG[slug];
  if (!p) notFound();

  const others = PROBLEMS.filter((x) => x.slug !== p.slug).slice(0, 3);

  return (
    <>
      <PageHero eyebrow={p.who} title={p.title} subtitle={p.subtitle} />

      {/* What's actually happening */}
      <section className="bg-sand">
        <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
          <Reveal>
            <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-electric">
              What’s actually happening
            </span>
            <p className="mt-4 text-xl leading-relaxed sm:text-2xl sm:leading-relaxed">{p.symptom}</p>
          </Reveal>
        </div>
      </section>

      {/* What it costs today */}
      <section className="mx-auto max-w-4xl px-5 py-20 sm:px-8">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">What it costs you today</h2>
          <ul className="mt-8 space-y-3">
            {p.costs.map((c) => (
              <li
                key={c}
                className="flex items-start gap-3.5 rounded-xl border border-border bg-card px-5 py-4"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <span className="text-[15px] leading-relaxed">{c}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* How Aegis handles it */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-5xl px-5 py-24 sm:px-8">
          <Reveal>
            <h2 className="display-lg max-w-2xl">How Aegis handles it</h2>
          </Reveal>
          <div className="mt-12 space-y-4">
            {p.steps.map((s, i) => (
              <Reveal key={s.t} index={i % 2}>
                <div className="grid gap-5 rounded-2xl border border-border bg-card p-7 sm:grid-cols-[auto_1fr] sm:gap-8 sm:p-8">
                  <div className="font-mono text-sm font-medium text-electric">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight">{s.t}</h3>
                    <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">{s.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Deliverables + lenses */}
      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <Reveal>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">What you walk away with</h2>
              <ul className="mt-6 space-y-3">
                {p.deliverables.map((d) => (
                  <li key={d} className="flex items-start gap-3 text-[15px] leading-relaxed">
                    <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-electric/12">
                      <Check className="h-3 w-3 text-electric" />
                    </span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal index={1}>
            <div className="rounded-2xl border border-border bg-surface p-7">
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                Review lenses applied
              </h3>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {p.lenses.map((l) => (
                  <span
                    key={l}
                    className="rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] font-medium"
                  >
                    {l}
                  </span>
                ))}
              </div>
              <Link
                href="/assessment"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-electric hover:underline"
              >
                See all 20 lenses <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Other problems */}
      <section className="border-t border-border bg-paper">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
            Other problems teams bring us
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/use-cases/${o.slug}`}
                className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-electric/40"
              >
                <p className="text-[14.5px] font-medium leading-snug">“{o.trigger}”</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-electric">
                  Read <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink">
        <div className="mx-auto max-w-4xl px-5 py-24 text-center sm:px-8">
          <h2 className="display-lg text-white">Start with this problem. Solve it this week.</h2>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-paper px-7 text-[15px] font-medium text-ink transition-transform hover:scale-[1.03]"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/use-cases"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-7 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" /> All use cases
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

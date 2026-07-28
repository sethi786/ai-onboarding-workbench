import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { PROBLEMS } from '@/lib/problems';

/**
 * Buyer-first entry point. Visitors rarely arrive looking for "a governance
 * platform" — they arrive with one specific thing blocking them. Let them
 * self-route by that instead of by our feature names.
 */
export function ProblemRouter() {
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
        <Reveal>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <h2 className="display-lg">What&rsquo;s blocking you this week?</h2>
            <p className="max-w-md self-end text-lg leading-relaxed text-muted-foreground">
              Most people don&rsquo;t arrive shopping for governance software. They arrive with one
              urgent problem. Pick yours.
            </p>
          </div>
        </Reveal>

        {/* A ruled index, not a card grid. Eight bordered boxes read as one
            undifferentiated block; a list with hairlines reads as a list, which
            is what this is. */}
        <div className="mt-12 border-t border-foreground/15">
          {PROBLEMS.map((p, i) => (
            <Reveal key={p.slug} index={i % 2}>
              <Link
                href={`/use-cases/${p.slug}`}
                className="group flex items-baseline gap-5 border-b border-border py-5 transition-colors hover:bg-paper/60 sm:gap-8"
              >
                <span className="w-6 shrink-0 font-mono text-[12px] text-muted-foreground/70">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 text-[17px] font-medium leading-snug tracking-[-0.01em] sm:text-[19px]">
                  &ldquo;{p.trigger}&rdquo;
                </span>
                <span className="hidden shrink-0 text-[13px] text-muted-foreground sm:block">
                  {p.who}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 self-center text-muted-foreground/40 transition-transform group-hover:translate-x-1 group-hover:text-electric" />
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mt-8 text-sm text-muted-foreground">
            Not listed?{' '}
            <Link href="/contact" className="font-medium text-electric hover:underline">
              Tell us what you’re dealing with
            </Link>{' '}
            — we’ll tell you honestly whether Aegis helps.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

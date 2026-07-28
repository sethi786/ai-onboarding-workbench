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
          <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-electric">
            Start where you’re stuck
          </span>
          <h2 className="display-lg mt-4 max-w-2xl">What’s blocking you this week?</h2>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Most people don’t arrive shopping for governance software. They arrive with one urgent
            problem. Pick yours.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          {PROBLEMS.map((p, i) => (
            <Reveal key={p.slug} index={i % 2}>
              <Link
                href={`/use-cases/${p.slug}`}
                className="group flex h-full items-start gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-electric/40 hover:bg-muted/30"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-electric" />
                <span className="flex-1">
                  <span className="block text-[15px] font-medium leading-snug">“{p.trigger}”</span>
                  <span className="mt-1 block text-[13px] text-muted-foreground">{p.who}</span>
                </span>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-electric" />
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

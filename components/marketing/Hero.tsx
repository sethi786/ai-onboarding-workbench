import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Check } from 'lucide-react';
import { ProductPreview } from './ProductPreview';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-paper">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-24">
        <div className="grid items-end gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
          <div>
            <p className="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-electric">
              <span className="h-2 w-2 rounded-full bg-electric" />A workspace
              for AI governance
            </p>
            <h1 className="display-xl max-w-3xl">
              Move AI forward.
              <br />
              <span className="text-electric">With evidence.</span>
            </h1>
          </div>
          <div className="pb-1">
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Turn scattered AI reviews into a clear, shared process. Know what
              you use, see what needs attention, and bring the right evidence to
              every decision.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-medium text-paper"
              >
                Start an assessment
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border px-6 text-sm font-medium hover:bg-muted"
              >
                Explore the demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              3 free evaluations. No credit card required.
            </p>
          </div>
        </div>
        <div className="mt-12 rounded-2xl bg-sage p-3 sm:mt-16 sm:p-6 lg:p-8">
          <div className="shadow-float rounded-xl">
            <ProductPreview />
          </div>
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
          {[
            '20 review lenses',
            'Evidence linked to each control',
            'Clear ownership and next actions',
          ].map((item) => (
            <span className="inline-flex items-center gap-2" key={item}>
              <Check className="h-3.5 w-3.5 text-electric" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import { CountUp } from '@/components/motion/CountUp';

const STATS = [
  { value: 20, suffix: '', label: 'Enterprise review lenses' },
  { value: 150, suffix: '+', label: 'Controls & evidence items' },
  { value: 25, suffix: '', label: 'Adoption workflow stages' },
  { value: 15, suffix: '+', label: 'Prefilled tool templates' },
];

export function Stats() {
  return (
    <section className="border-y border-border bg-paper">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-12 px-5 py-20 sm:px-8 md:grid-cols-4 md:py-24">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-5xl font-semibold tracking-[-0.04em] text-foreground sm:text-6xl">
              <CountUp value={s.value} suffix={s.suffix} />
            </div>
            <div className="mx-auto mt-3 max-w-[14ch] text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

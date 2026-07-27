'use client';

import { CountUp } from '@/components/motion/CountUp';

const STATS = [
  { value: 20, suffix: '', label: 'Enterprise review lenses' },
  { value: 150, suffix: '+', label: 'Controls & evidence items' },
  { value: 25, suffix: '', label: 'Onboarding workflow stages' },
  { value: 15, suffix: '+', label: 'Prefilled AI tools' },
];

export function Stats() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="grid grid-cols-2 gap-6 rounded-2xl border border-border bg-card p-8 md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-4xl font-bold tracking-tight text-foreground">
              <CountUp value={s.value} suffix={s.suffix} />
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

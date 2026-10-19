import type { Metadata } from 'next';
import { Check, Minus } from 'lucide-react';
import { PageHero } from '@/components/marketing/PageHero';
import { Reveal } from '@/components/motion/Reveal';
import { Pricing, FAQ } from '@/components/marketing/LandingSections';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Start free. Upgrade when your tool portfolio grows. Simple, transparent plans.',
};

const MATRIX: {
  feature: string;
  starter: boolean | string;
  team: boolean | string;
  ent: boolean | string;
}[] = [
  {
    feature: 'Review lenses',
    starter: 'All 20',
    team: 'All 20',
    ent: 'All 20',
  },
  {
    feature: 'Stored evaluations',
    starter: '3',
    team: 'Unlimited',
    ent: 'By agreement',
  },
  {
    feature: 'Workspace members',
    starter: '1',
    team: '25',
    ent: 'By agreement',
  },
  {
    feature: 'Readiness scores & evidence links',
    starter: true,
    team: true,
    ent: true,
  },
  {
    feature: 'Tool catalogue & assessment starters',
    starter: true,
    team: true,
    ent: true,
  },
  {
    feature: 'CSV, JSON & Markdown exports',
    starter: true,
    team: true,
    ent: true,
  },
  { feature: '25-stage review workflow', starter: true, team: true, ent: true },
  {
    feature: 'Draft evidence packs & recorded decisions',
    starter: false,
    team: true,
    ent: true,
  },
  {
    feature: 'SSO, SCIM & custom lens authoring',
    starter: 'Not available',
    team: 'Not available',
    ent: 'Requires separate scoping',
  },
];

function Cell({ v }: { v: boolean | string }) {
  if (v === true)
    return (
      <span>
        <Check aria-hidden="true" className="mx-auto h-4 w-4 text-electric" />
        <span className="sr-only">Included</span>
      </span>
    );
  if (v === false)
    return (
      <span>
        <Minus
          aria-hidden="true"
          className="mx-auto h-4 w-4 text-muted-foreground/40"
        />
        <span className="sr-only">Not included</span>
      </span>
    );
  return <span className="text-[13px] font-medium">{v}</span>;
}

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Start free. Grow when you do."
        subtitle="Start by assessing three tools free. Upgrade when you need more evaluations and a shared team workflow."
      />

      <Pricing />

      {/* Comparison matrix */}
      <section className="mx-auto max-w-5xl px-5 py-24 sm:px-8">
        <Reveal>
          <h2 className="display-lg text-center">Compare plans</h2>
        </Reveal>
        <Reveal>
          <div className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-left text-[13px] font-semibold" />
                  <th className="p-4 text-center text-[15px] font-semibold">
                    Starter
                  </th>
                  <th className="rounded-t-xl bg-ink/[0.03] p-4 text-center text-[15px] font-semibold">
                    Team
                  </th>
                  <th className="p-4 text-center text-[15px] font-semibold">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((r) => (
                  <tr key={r.feature} className="border-b border-border">
                    <td className="p-4 text-left font-medium">{r.feature}</td>
                    <td className="p-4 text-center">
                      <Cell v={r.starter} />
                    </td>
                    <td className="bg-ink/[0.03] p-4 text-center">
                      <Cell v={r.team} />
                    </td>
                    <td className="p-4 text-center">
                      <Cell v={r.ent} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      <FAQ />
    </>
  );
}

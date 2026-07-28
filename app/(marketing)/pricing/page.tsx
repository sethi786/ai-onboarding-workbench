import type { Metadata } from 'next';
import { Check, Minus } from 'lucide-react';
import { PageHero } from '@/components/marketing/PageHero';
import { Reveal } from '@/components/motion/Reveal';
import { Pricing, FAQ } from '@/components/marketing/LandingSections';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Take one tool all the way through, free — evidence packs and branded review document included. Upgrade when your portfolio grows.',
};

// Mirrors lib/plans.ts exactly. When these disagree, the marketing page is
// selling something the product refuses to do — the worst kind of bug to ship.
const MATRIX: { feature: string; starter: boolean | string; team: boolean | string; ent: boolean | string }[] = [
  { feature: 'Review lenses', starter: 'All 20', team: 'All 20', ent: 'All 20 + custom' },
  { feature: 'Active evaluations', starter: '1', team: 'Unlimited', ent: 'Unlimited' },
  { feature: 'Seats', starter: '3', team: '25', ent: 'Unlimited' },
  { feature: 'Readiness scoring & risk grade', starter: true, team: true, ent: true },
  { feature: 'Prefilled tool library', starter: true, team: true, ent: true },
  { feature: 'Evidence packs', starter: true, team: true, ent: true },
  { feature: 'Branded review document & exports', starter: true, team: true, ent: true },
  { feature: 'Generated diagrams', starter: true, team: true, ent: true },
  { feature: 'Workflow & approvals', starter: true, team: true, ent: true },
  { feature: 'Multiple workspaces', starter: false, team: true, ent: true },
  { feature: 'SSO / SCIM', starter: false, team: false, ent: true },
  { feature: 'Custom lenses & templates', starter: false, team: false, ent: true },
  { feature: 'Audit & retention controls', starter: false, team: false, ent: true },
];

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <Check className="mx-auto h-4 w-4 text-electric" />;
  if (v === false) return <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />;
  return <span className="text-[13px] font-medium">{v}</span>;
}

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Start free. Grow when you do."
        subtitle="Your first tool goes all the way through on the free plan — library, evidence packs, diagrams, and the branded review document. Pay when you have a portfolio, not a pilot."
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
                  <th className="p-4 text-center text-[15px] font-semibold">Starter</th>
                  <th className="rounded-t-xl bg-ink/[0.03] p-4 text-center text-[15px] font-semibold">Team</th>
                  <th className="p-4 text-center text-[15px] font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((r) => (
                  <tr key={r.feature} className="border-b border-border">
                    <td className="p-4 text-left font-medium">{r.feature}</td>
                    <td className="p-4 text-center"><Cell v={r.starter} /></td>
                    <td className="bg-ink/[0.03] p-4 text-center"><Cell v={r.team} /></td>
                    <td className="p-4 text-center"><Cell v={r.ent} /></td>
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

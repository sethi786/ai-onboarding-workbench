import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/marketing/PageHero';
import { TEAM_LENSES } from '@/workbench/data/teamLenses';

export const metadata: Metadata = {
  title: 'Readiness Assessment',
  description: 'The 20 enterprise review lenses Clearance AI simulates.',
};

export default function AssessmentPage() {
  return (
    <>
      <PageHero
        eyebrow="The methodology"
        title="20 review lenses. One readiness score."
        subtitle="Each lens mirrors a real enterprise review team — what they inspect, the controls they validate, the evidence they require, and what blocks approval."
      />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-2">
          {TEAM_LENSES.map((lens) => (
            <div key={lens.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <span className="text-xl">{lens.icon}</span>
                <h3 className="font-semibold">{lens.title}</h3>
                <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                  {lens.checklist.length} checks · {lens.requiredControls.length} controls
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{lens.reviewPurpose}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-xl border border-border bg-muted/40 p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">See your readiness score in minutes</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Instantiate a prefilled AI tool or start from scratch, then walk each lens.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-flex h-11 items-center rounded-md bg-electric px-6 text-[15px] font-medium text-white hover:opacity-90"
          >
            Start a readiness evaluation
          </Link>
        </div>
      </section>
    </>
  );
}

import Link from 'next/link';
import { LiveDemo } from '@/components/marketing/LiveDemo';
import { ArrowRight } from 'lucide-react';
export const metadata = {
  title: 'Interactive product demo',
  description:
    'Try the Aegis readiness engine using a fictional AI agent. Explore controls, evidence, and blockers without signing up.',
};
export default function DemoPage() {
  return (
    <>
      <LiveDemo />
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            [
              '01',
              'Set the readiness score',
              'Move the self-assessment slider. A high score alone does not make an evaluation ready.',
            ],
            [
              '02',
              'Add controls and evidence',
              'Simulate reviewed controls and current evidence references to see how support changes the result.',
            ],
            [
              '03',
              'Introduce a blocker',
              'A critical blocker prevents a ready recommendation, even when other work is complete.',
            ],
          ].map(([number, title, description]) => (
            <div key={number}>
              <p className="font-mono text-xs text-electric">{number}</p>
              <h2 className="mt-3 text-lg font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold">
            Continue with a tool your team uses.
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            In a workspace, each lens has its own controls, evidence references,
            owner, due date, and recorded decision. This public demonstration
            uses fictional inputs and resets when you leave; it does not save an
            assessment.
          </p>
          <div className="mt-5 flex flex-wrap gap-5">
            <Link
              href="/tools"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-electric"
            >
              Explore 40 tool starters
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-paper"
            >
              Create your workspace
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

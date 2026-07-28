import type { Metadata } from 'next';
import { PageHero } from '@/components/marketing/PageHero';
import { ScopeTool } from '@/components/marketing/ScopeTool';

export const metadata: Metadata = {
  title: 'Scope a review — free, no signup',
  description:
    'Name any tool and see which of the 20 enterprise reviews actually apply, how deep each goes, and how many controls you owe — with the reason for every review skipped. Runs in your browser.',
};

export default function ScopePage() {
  return (
    <>
      <PageHero
        eyebrow="Free, no signup"
        title="Find out how much review this actually needs."
        subtitle="Most of the work in a tool review is deciding what doesn’t apply. Name what you’re adopting, answer five questions, and see the scope — including the reason behind every review we tell you to skip."
      />
      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
          <ScopeTool />
        </div>
      </section>
    </>
  );
}

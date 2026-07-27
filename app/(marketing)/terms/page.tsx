import type { Metadata } from 'next';
import { PageHero } from '@/components/marketing/PageHero';

export const metadata: Metadata = { title: 'Terms' };

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms of Service" />
      <section className="mx-auto max-w-3xl px-6 py-16 text-[15px] leading-relaxed text-muted-foreground">
        <p className="text-sm">
          <em>Template placeholder — replace with your reviewed terms of service before launch.</em>
        </p>
        <h2 className="mt-8 text-lg font-semibold text-foreground">Self-evaluation aid</h2>
        <p className="mt-2">
          Aegis is a self-evaluation and readiness aid. Outputs, scores, and generated
          artifacts are drafts to help you prepare for review. They do not constitute approval and do
          not replace your organization’s official governance, security, privacy, legal, risk, and
          go/no-go processes.
        </p>
        <h2 className="mt-6 text-lg font-semibold text-foreground">Acceptable use</h2>
        <p className="mt-2">
          You are responsible for the accuracy of the information you enter and for following your
          organization’s policies when acting on Aegis outputs.
        </p>
      </section>
    </>
  );
}

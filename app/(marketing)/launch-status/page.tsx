import Link from 'next/link';
import { PageHero } from '@/components/marketing/PageHero';
export const metadata = { title: 'Workspace access', robots: { index: false } };
export default function LaunchStatusPage() {
  return (
    <>
      <PageHero
        eyebrow="Launch preview"
        title="Your next AI review starts here."
        subtitle="Workspace registration is not open on this deployment yet. You can explore the product without entering personal or payment details."
      />
      <div className="mx-auto flex max-w-xl flex-wrap justify-center gap-6 px-5 pb-24">
        <Link
          className="rounded-full bg-ink px-6 py-3 text-paper"
          href="/#demo"
        >
          Try the interactive demo
        </Link>
        <Link
          className="rounded-full border border-border px-6 py-3"
          href="/tools"
        >
          Explore the tool catalogue
        </Link>
      </div>
    </>
  );
}

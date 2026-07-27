import type { Metadata } from 'next';
import { PageHero } from '@/components/marketing/PageHero';

export const metadata: Metadata = { title: 'Privacy' };

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" />
      <section className="mx-auto max-w-3xl px-6 py-16 text-[15px] leading-relaxed text-muted-foreground">
        <p className="text-sm">
          <em>
            Template placeholder — replace with your organization’s reviewed privacy policy before
            launch.
          </em>
        </p>
        <h2 className="mt-8 text-lg font-semibold text-foreground">Data we process</h2>
        <p className="mt-2">
          Clearance AI stores the evaluation content you create (AI tool profiles, self-assessment
          scores, notes, evidence links) scoped to your organization’s workspace. Authentication is
          handled by Supabase Auth.
        </p>
        <h2 className="mt-6 text-lg font-semibold text-foreground">Tenant isolation</h2>
        <p className="mt-2">
          Workspace data is isolated per organization using row-level security. Members can access
          only the organizations they belong to.
        </p>
        <h2 className="mt-6 text-lg font-semibold text-foreground">Contact</h2>
        <p className="mt-2">Questions: privacy@clearance.ai</p>
      </section>
    </>
  );
}

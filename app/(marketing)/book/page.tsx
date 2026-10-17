import { PageHero } from '@/components/marketing/PageHero';
import { LeadForm } from '@/components/marketing/LeadForm';
import { leadsConfigured } from '@/lib/launch/readiness';
import { SITE } from '@/lib/site';
export const metadata = { title: 'Request a demo' };
export const dynamic = 'force-dynamic';
export default function BookPage() {
  return (
    <>
      <PageHero
        eyebrow="Product walkthrough"
        title="See Aegis on your AI stack."
        subtitle="Explore intake, evidence, readiness scoring, and review handoffs with your team."
      />
      <section className="mx-auto max-w-xl px-5 py-16">
        <LeadForm
          kind="demo"
          enabled={leadsConfigured()}
          supportEmail={SITE.email}
        />
      </section>
    </>
  );
}

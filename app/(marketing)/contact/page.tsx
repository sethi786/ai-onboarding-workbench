import { PageHero } from '@/components/marketing/PageHero';
import { LeadForm } from '@/components/marketing/LeadForm';
import { leadsConfigured } from '@/lib/launch/readiness';
import { SITE } from '@/lib/site';
export const metadata = { title: 'Contact' };
export const dynamic = 'force-dynamic';
export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let’s talk about your AI review process."
        subtitle="Questions about Aegis, a plan, or a security review? Tell us what you need."
      />
      <section className="mx-auto max-w-xl px-5 py-16">
        <LeadForm
          kind="contact"
          enabled={leadsConfigured()}
          supportEmail={SITE.email}
        />
      </section>
    </>
  );
}

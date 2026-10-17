import Link from 'next/link';
import { PageHero } from '@/components/marketing/PageHero';
export const metadata = { title: 'Service terms' };
const sections = [
  [
    'What the service provides',
    'Aegis is a self-assessment and review-readiness aid. Scores, risk grades, recommendations, and generated artifacts reflect submitted information and an internal rubric. They are not formal approvals, professional advice, certification, or guarantees of compliance or safety. Your organization remains responsible for its review and deployment decisions.',
  ],
  [
    'Accounts and workspaces',
    'Use accurate account details and keep credentials secure. Workspace owners are responsible for authorized membership, subscription management, and the content their team supplies. Invite links must be shared only with their intended recipients.',
  ],
  [
    'Your content',
    'You retain rights in your assessment content. You must have permission to submit it and to share linked evidence. The service uses that content to provide workspace functionality. Do not upload credentials, malicious material, unlawful content, or information you are not authorized to process.',
  ],
  [
    'Plans and payment',
    'Starter includes three stored evaluations and one member. Team is priced in US dollars per workspace, billed monthly, with applicable taxes shown at checkout. Recurring payment details and the final amount appear in Stripe checkout before you subscribe. Paid subscriptions are available only after launch configuration is complete. Enterprise delivery and pricing require a separate written agreement.',
  ],
  [
    'Cancellation and changes',
    'Workspace owners can manage or cancel a subscription through billing management. Cancellation takes effect according to the paid billing period shown there. When paid access ends, Starter limits apply and existing evaluations are retained. Refund requests should be directed to the operator; applicable consumer rights are not excluded.',
  ],
  [
    'Availability and support',
    'This release does not include a service-level guarantee, independent certification, SSO, SCIM, or custom lens authoring. Do not rely on roadmap features as purchase commitments. Contact the operator to agree any additional delivery, support, security, or data-processing requirements.',
  ],
  [
    'Before production use',
    'The operator must finalize its legal identity, contact details, jurisdiction-specific terms, data-processing obligations, retention policy, and any additional contractual provisions before accepting production customers. These product terms are a launch draft pending that review.',
  ],
];
export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Service terms"
        title="Clear expectations for using Aegis."
        subtitle="Launch draft · Prepared October 17, 2026"
      />
      <section className="mx-auto max-w-3xl px-6 pb-24 text-sm leading-relaxed">
        <p className="rounded-xl border border-border bg-muted p-5">
          Operator:{' '}
          {process.env.NEXT_PUBLIC_LEGAL_ENTITY ||
            'To be confirmed before launch.'}
        </p>
        {sections.map(([title, body]) => (
          <section className="mt-8" key={title}>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-3 text-muted-foreground">{body}</p>
          </section>
        ))}
        <p className="mt-8">
          <Link className="text-electric underline" href="/contact">
            Contact the operator
          </Link>{' '}
          ·{' '}
          <Link className="text-electric underline" href="/privacy">
            Privacy notice
          </Link>
        </p>
      </section>
    </>
  );
}

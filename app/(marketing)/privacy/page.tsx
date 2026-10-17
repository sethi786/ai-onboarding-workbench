import Link from 'next/link';
import { PageHero } from '@/components/marketing/PageHero';
import { SITE } from '@/lib/site';
export const metadata = { title: 'Privacy notice' };
const sections = [
  [
    'Information processed',
    'Account email and authentication information; workspace membership; tool profiles, scores, notes, decisions, evidence URLs and generated reports; enquiry details you submit; and operational request information handled by our hosting providers. Please avoid putting personal or confidential information into evidence URL parameters.',
  ],
  [
    'Purpose',
    'This information is used to authenticate users, maintain workspaces, provide assessments and exports, respond to enquiries, manage subscriptions, and operate and protect the service. The scoring and draft report engine uses application rules and templates; it does not send assessment content to a generative AI provider.',
  ],
  [
    'Service providers',
    'The application uses Supabase for authentication and database storage, Vercel for hosting, Stripe for payments when enabled, and Cloudflare Turnstile to protect enquiry forms. These providers process information under their own service terms. Hosting regions, transfer arrangements, and the applicable provider list must be confirmed for the production deployment.',
  ],
  [
    'Workspace access',
    'Workspace members can access information according to their role. Evidence URLs can point to services with their own access policies. Aegis does not make a linked document private or grant access to it. Never include passwords, access tokens, or unrestricted sensitive document links.',
  ],
  [
    'Cookies and local storage',
    'Authentication uses essential session cookies. The public interactive demo may use local browser state and is separate from a saved workspace. Enquiry verification loads Cloudflare Turnstile only on the enquiry form. The application does not include advertising trackers.',
  ],
  [
    'Retention and deletion',
    'Evaluation records remain in a workspace until deleted by an authorized owner or admin. Billing and enquiry records may be retained for operational, accounting, or legal needs. Backup retention depends on deployment configuration. The operator must confirm its retention schedule before production launch.',
  ],
  [
    'Your requests',
    'You can export evaluation data from the product. For account deletion, workspace deletion, corrections, or questions about personal information, contact the operator. We may need to verify your identity and authority over a workspace before acting.',
  ],
];
export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Privacy"
        title="How Aegis handles your information."
        subtitle="Product data practices · Prepared October 17, 2026"
      />
      <section className="mx-auto max-w-3xl px-6 pb-24 text-sm leading-relaxed">
        <div className="rounded-xl border border-border bg-muted p-5">
          <p>
            Operator:{' '}
            {process.env.NEXT_PUBLIC_LEGAL_ENTITY ||
              'Operator identity must be supplied before launch.'}
          </p>
          <p className="mt-2">
            This notice describes the release implementation. Production terms,
            processing locations, and retention details require operator review
            before accepting customer data.
          </p>
        </div>
        {sections.map(([title, body]) => (
          <section className="mt-8" key={title}>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-3 text-muted-foreground">{body}</p>
          </section>
        ))}
        <h2 className="mt-8 text-lg font-semibold">Contact</h2>
        <p className="mt-3">
          {SITE.email ? (
            <a
              className="text-electric underline"
              href={`mailto:${SITE.email}`}
            >
              {SITE.email}
            </a>
          ) : (
            <Link href="/contact" className="text-electric underline">
              Contact options
            </Link>
          )}
        </p>
      </section>
    </>
  );
}

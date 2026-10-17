import Link from 'next/link';
import { PageHero } from '@/components/marketing/PageHero';
export const metadata = { title: 'Security & trust' };
const controls = [
  [
    'Workspace activity',
    'Database triggers record changes to evaluations, evidence, review decisions, invitations, and member roles. Workspace members can read the history; application users cannot edit or delete events. Authorized database operators retain administrative access.',
  ],
  [
    'Workspace isolation',
    'Database row-level policies and server-side membership checks restrict workspace records. Owners, admins, members, and viewers have different permissions.',
  ],
  [
    'Evidence stays under your control',
    'The application stores evidence links and review notes. It does not retrieve the linked documents or verify their contents. Keep source evidence in your approved document system.',
  ],
  [
    'Payment handling',
    'Configured paid plans use Stripe-hosted checkout and billing management. Aegis does not collect card numbers. Signed server callbacks reconcile subscription access.',
  ],
  [
    'Account security',
    'Email and password authentication is provided by Supabase Auth. Email confirmation and recovery settings must be configured for each deployment. SSO and SCIM are not available in this release.',
  ],
  [
    'Review integrity',
    'Scope changes require assessment reconfirmation. Missing or expired evidence and unresolved blockers affect readiness. Review decisions are self-reported, not independently verified signatures.',
  ],
  [
    'Data portability',
    'CSV, JSON, and Markdown assessment exports are available on all plans. Owners and admins can delete evaluations. Contact the operator for account or workspace deletion requests.',
  ],
];
export default function SecurityPage() {
  return (
    <>
      <PageHero
        eyebrow="Security & trust"
        title="Trust starts with clear boundaries."
        subtitle="What Aegis implements, what it records, and what still requires your organization’s review."
      />
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {controls.map(([title, body]) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-card p-7"
            >
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-10 rounded-2xl bg-ink p-8 text-paper">
          <h2 className="text-2xl font-semibold">
            No certification is implied.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/70">
            Aegis does not claim SOC 2, ISO 27001, HIPAA, or other independent
            certification. Its internal readiness rubric is a planning aid, not
            a legal compliance determination or an external industry benchmark.
            Infrastructure configuration, backups, recovery, monitoring, and
            security testing need to be verified for the deployed service.
          </p>
          <Link href="/contact" className="mt-6 inline-block text-sm underline">
            Ask for deployment-specific security details
          </Link>
        </div>
      </section>
    </>
  );
}

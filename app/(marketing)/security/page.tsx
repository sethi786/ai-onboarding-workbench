import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Lock, Database, KeyRound, FileText, Server, ArrowRight } from 'lucide-react';
import { PageHero } from '@/components/marketing/PageHero';
import { Reveal } from '@/components/motion/Reveal';

export const metadata: Metadata = {
  title: 'Security & Trust',
  description: 'How Aegis protects the governance data you trust it with.',
};

const PILLARS = [
  { icon: Database, t: 'Tenant isolation', d: 'Every record is scoped to your organization and enforced with database row-level security. One workspace can never read another’s data.' },
  { icon: KeyRound, t: 'Authenticated access', d: 'Access is verified on every request. Roles govern who can view, edit, and approve inside your workspace.' },
  { icon: Lock, t: 'Encryption in transit & at rest', d: 'Traffic is served over TLS and data is encrypted at rest by the managed platform we build on.' },
  { icon: FileText, t: 'You own your data', d: 'Export or delete your evaluations at any time. Your governance content is yours — we don’t train on it or sell it.' },
  { icon: Server, t: 'Reputable infrastructure', d: 'Aegis runs on managed cloud infrastructure (Vercel + Supabase/Postgres) with the operational controls those platforms provide.' },
  { icon: ShieldCheck, t: 'Least privilege by design', d: 'Service credentials are server-side only and scoped narrowly. The app follows the same least-privilege principle it asks you to review for.' },
];

export default function SecurityPage() {
  return (
    <>
      <PageHero
        eyebrow="Security & Trust"
        title="You’re trusting us with governance data. Here’s how we protect it."
        subtitle="Aegis holds sensitive review evidence about the tools you adopt. We treat that data with the same rigor the platform helps you demand of others."
      />

      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Reveal key={p.t} index={i % 3}>
              <div className="flex h-full flex-col bg-card p-7">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-electric/10">
                  <p.icon className="h-5 w-5 text-electric" />
                </div>
                <h3 className="mt-5 text-[17px] font-semibold tracking-tight">{p.t}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{p.d}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* The AI subprocessor question — the one a CISO asks first about an
            AI product, and the one most vendors bury. */}
        <div className="mt-14 rounded-2xl border border-border bg-card p-8 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight">
            What happens when you use the AI assistant
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
            Aegis reviews AI tools, so we hold ourselves to the questions we ask about them. Here is
            the whole answer, in the order a security reviewer asks it.
          </p>

          <dl className="mt-8 grid gap-6 sm:grid-cols-2">
            {[
              {
                q: 'Can we turn it off?',
                a: 'Yes, per workspace, in Settings. Turning it off is enforced on the server — every AI action is refused and the refusal is logged, not merely hidden from the interface. Everything else keeps working: scoring, scope, diagrams, documents, and the regulatory mapping never touch a model.',
              },
              {
                q: 'Where does the data go?',
                a: 'To Anthropic\u2019s API, and nowhere else. Only the evaluation content needed for the specific request is sent — a pasted description, one lens\u2019s controls, or the recorded assessment behind a questionnaire answer.',
              },
              {
                q: 'Is our data used for training?',
                a: 'No. Anthropic does not train models on data submitted through its API. We do not retain prompts or responses beyond the request, and we do not use your governance content to improve anything we sell.',
              },
              {
                q: 'Can you prove what you sent?',
                a: 'Every AI call is written to your audit trail with the model, the provider, the size of the input, and a SHA-256 of exactly what was sent \u2014 which you can recompute. We record the fingerprint rather than a second copy of your data, on purpose.',
              },
              {
                q: 'Who can trigger it?',
                a: 'Members with edit rights, rate-limited per workspace so one person cannot run up the bill. Viewers cannot invoke it at all.',
              },
              {
                q: 'What if a vendor page tries to manipulate it?',
                a: 'Pasted content is treated as untrusted data, never as instructions. The assistant is told to report an attempted injection as a finding rather than follow it \u2014 a vendor description trying to mark its own controls satisfied is itself something a reviewer should see.',
              },
            ].map((item) => (
              <div key={item.q}>
                <dt className="font-semibold">{item.q}</dt>
                <dd className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{item.a}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 border-t border-border pt-5 text-[15px] leading-relaxed text-muted-foreground">
            The assistant drafts; a named human edits, owns, and submits. Nothing it produces is
            recorded as a decision on its own \u2014 that would be the exact failure this product
            exists to prevent.
          </p>
        </div>

        {/* Compliance posture — honest */}
        <div className="mt-14 grid gap-8 rounded-2xl border border-border bg-surface p-8 sm:p-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Compliance posture</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              Aegis is built around the controls in SOC 2, ISO 27001, NIST AI RMF, and common privacy
              regimes — it’s the subject matter of the product. We’re transparent about where we are:
              our practices are <span className="font-medium text-foreground">aligned</span> to these
              frameworks, and formal third-party attestations are on the roadmap as we grow. We’d
              rather tell you exactly that than imply a certificate we don’t yet hold.
            </p>
          </div>
          <ul className="grid gap-3 self-center">
            {[
              ['SOC 2', 'Aligned · attestation on roadmap'],
              ['ISO 27001', 'Aligned · attestation on roadmap'],
              ['NIST AI RMF', 'Mapped across the AI lenses'],
              ['GDPR / privacy', 'Data export & deletion supported'],
              ['EU AI Act', 'Controls mapped to Articles 4, 9\u201315 and 26'],
              ['Audit trail', 'Append-only, exportable as CSV'],
            ].map(([k, v]) => (
              <li key={k} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5">
                <span className="text-sm font-semibold">{k}</span>
                <span className="text-[13px] text-muted-foreground">{v}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Have a security questionnaire or need details for your own review?{' '}
          <Link href="/contact" className="font-medium text-electric hover:underline">
            Talk to us
          </Link>{' '}
          — we’ll answer directly.
        </div>
      </section>

      <section className="bg-ink">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8">
          <h2 className="display-lg text-white">Governance you can stand behind.</h2>
          <Link
            href="/signup"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-paper px-7 text-[15px] font-medium text-ink transition-transform hover:scale-[1.03]"
          >
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

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

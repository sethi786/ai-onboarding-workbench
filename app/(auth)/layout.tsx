import Link from 'next/link';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { ArrowLeft, Check, ShieldCheck, Boxes, FileCheck2 } from 'lucide-react';
import { ShieldLogo } from '@/components/brand/ShieldLogo';
import { AccountUnavailable } from '@/components/auth/AccountUnavailable';

const POINTS = [
  {
    icon: ShieldCheck,
    t: 'Bring your AI inventory together',
    d: 'Start with a tool, its owner, its purpose and the data it uses.',
  },
  {
    icon: Boxes,
    t: 'See what needs attention',
    d: 'Review security, privacy, risk and operational controls with your team.',
  },
  {
    icon: FileCheck2,
    t: 'Keep a record of the decision',
    d: 'Connect evidence, review notes, ownership and next steps in one place.',
  },
];
export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const available = isSupabaseConfigured();
  return (
    <div className="grid min-h-dvh bg-paper lg:grid-cols-[1fr_1.05fr]">
      <a href="#account-content" className="skip-link">
        Skip to account access
      </a>
      {/* Value panel */}
      <div className="relative hidden border-r border-border bg-ink p-10 text-white lg:flex lg:flex-col xl:p-14">
        <div className="relative flex h-full flex-col">
          <Link href="/" aria-label="Aegis home">
            <ShieldLogo tone="light" />
          </Link>
          <div className="my-auto max-w-md py-16">
            <p className="mb-5 text-xs font-medium uppercase tracking-[0.18em] text-white/60">
              AI governance, together
            </p>
            <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight xl:text-5xl">
              Every AI decision.
              <br />
              One clear record.
            </h2>
            <div className="mt-10 space-y-6">
              {POINTS.map((p) => (
                <div key={p.t} className="flex gap-3.5">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 ring-1 ring-white/10">
                    <p.icon className="h-4 w-4 text-white/80" />
                  </span>
                  <div>
                    <div className="font-medium">{p.t}</div>
                    <div className="mt-1 text-sm leading-6 text-white/60">
                      {p.d}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="inline-flex items-center gap-2 border-t border-white/10 pt-6 text-xs text-white/60">
            <Check className="h-4 w-4" /> Structured reviews. Decisions stay
            with your team.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex min-w-0 flex-col px-5 py-6 sm:px-10 lg:px-12">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="Aegis home" className="lg:hidden">
            <ShieldLogo />
          </Link>
          <Link
            href="/"
            className="ml-auto inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to site
          </Link>
        </div>
        <main
          id="account-content"
          tabIndex={-1}
          className="mx-auto my-auto w-full max-w-md py-10 sm:py-14"
        >
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
            {available ? children : <AccountUnavailable />}
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <Link
              href="/privacy"
              className="inline-flex min-h-10 items-center hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="inline-flex min-h-10 items-center hover:text-foreground"
            >
              Terms
            </Link>
            <Link
              href="/resources"
              className="inline-flex min-h-10 items-center hover:text-foreground"
            >
              Help & guides
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

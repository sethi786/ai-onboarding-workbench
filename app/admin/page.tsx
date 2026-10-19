import Link from 'next/link';
import { ShieldLogo } from '@/components/brand/ShieldLogo';
import { deploymentDiagnostics } from '@/lib/admin/diagnostics';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Operations · Aegis',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const checks = await deploymentDiagnostics();
  const failures = checks.filter((check) => check.status === 'fail').length;
  return (
    <main className="min-h-screen bg-muted/30 px-5 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/">
            <ShieldLogo />
          </Link>
          <Link
            href="/portal/account"
            className="rounded-lg border bg-card px-4 py-3 text-sm"
          >
            Account & workspaces
          </Link>
        </header>
        <div className="mt-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-electric">
              Operator administration
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Deployment health
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Live, read-only checks of the account service and database API.
              These checks do not certify a launch or prove signup, saving,
              email delivery or payments.
            </p>
          </div>
          <a
            href="/admin"
            className="rounded-lg bg-ink px-5 py-3 text-sm font-medium text-paper"
          >
            Run checks again
          </a>
        </div>
        <section
          className="mt-8 grid gap-4 sm:grid-cols-3"
          aria-label="Check summary"
        >
          {[
            [
              'Successful probes',
              checks.filter((c) => c.status === 'pass').length,
            ],
            ['Failed probes', failures],
            [
              'Acceptance pending',
              checks.filter((c) => c.status === 'pending').length,
            ],
          ].map(([label, count]) => (
            <div key={label} className="rounded-xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-3 text-3xl font-semibold">{count}</p>
            </div>
          ))}
        </section>
        <section className="mt-8 overflow-hidden rounded-xl border bg-card">
          <div className="border-b p-5">
            <h2 className="font-semibold">Service checks</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Checked {new Date().toISOString()} · No customer records or
              credentials displayed.
            </p>
          </div>
          <ul className="divide-y">
            {checks.map((check) => (
              <li
                key={check.name}
                className="flex flex-wrap items-start justify-between gap-4 p-5"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-sm font-medium">
                    {check.name}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {check.detail}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${check.status === 'pass' ? 'bg-electric/10 text-electric' : check.status === 'fail' ? 'bg-danger/10 text-danger' : 'bg-muted text-muted-foreground'}`}
                >
                  {check.status === 'pass'
                    ? 'Passed'
                    : check.status === 'fail'
                      ? 'Needs attention'
                      : 'Pending verification'}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <p className="mt-6 text-sm leading-6 text-muted-foreground">
          Before opening sales: verify a new customer’s signup and recovery
          emails, create and reload an assessment, confirm tenant isolation, and
          complete a Stripe test checkout and cancellation. Review the release
          runbook in the repository.
        </p>
      </div>
    </main>
  );
}

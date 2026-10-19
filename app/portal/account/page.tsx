import Link from 'next/link';
import { requireUser } from '@/lib/auth/require-user';
import { listMyOrganizations } from '@/lib/auth/membership';
import { isOperator } from '@/lib/auth/operator';
import { ShieldLogo } from '@/components/brand/ShieldLogo';

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser('/portal/account');
  const orgs = await listMyOrganizations();
  const { error } = await searchParams;
  return (
    <main className="min-h-screen bg-muted/30 px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/">
          <ShieldLogo />
        </Link>
        <h1 className="mt-12 text-3xl font-semibold tracking-tight">
          Your account
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your sign-in and switch between workspaces.
        </p>
        {error === 'signout' && (
          <p
            role="alert"
            className="mt-6 rounded-lg border border-danger/30 p-4 text-sm text-danger"
          >
            Sign out could not be completed. Please retry.
          </p>
        )}
        <section className="mt-8 rounded-xl border bg-card p-6">
          <h2 className="font-semibold">Sign-in & security</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="mt-1 break-words font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Verification</dt>
              <dd className="mt-1">
                {user.email_confirmed_at
                  ? 'Email confirmed'
                  : 'Email not confirmed'}
              </dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/forgot-password"
              className="rounded-lg border px-4 py-3 text-sm"
            >
              Request password reset
            </Link>
            <form action="/auth/signout" method="post">
              <button className="rounded-lg border px-4 py-3 text-sm">
                Sign out of this browser
              </button>
            </form>
          </div>
        </section>
        <section className="mt-6 rounded-xl border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-6">
            <h2 className="font-semibold">Your workspaces</h2>
            <Link
              href="/portal/onboarding"
              className="text-sm text-electric underline"
            >
              Create workspace
            </Link>
          </div>
          <ul className="divide-y">
            {orgs.map(({ org, role }) => (
              <li key={org.id}>
                <Link
                  href={`/portal/${org.slug}/dashboard`}
                  className="flex items-center justify-between gap-4 p-6 hover:bg-muted/50"
                >
                  <span className="min-w-0 break-words text-sm font-medium">
                    {org.name}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs capitalize">
                    {role}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {!orgs.length && (
            <p className="p-6 text-sm text-muted-foreground">
              Create a workspace to start your first assessment.
            </p>
          )}
        </section>
        {isOperator(user) && (
          <Link
            href="/admin"
            className="mt-6 inline-flex rounded-lg bg-ink px-5 py-3 text-sm text-paper"
          >
            Open operator administration
          </Link>
        )}
      </div>
    </main>
  );
}

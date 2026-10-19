import Link from 'next/link';
import { safeNext } from '@/lib/auth/safe-redirect';
import { ShieldLogo } from '@/components/brand/ShieldLogo';

export const metadata = {
  title: 'Account link unavailable',
  robots: { index: false, follow: false },
};
export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNext((await searchParams).next);
  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 px-5 py-12">
      <section className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <Link href="/">
          <ShieldLogo />
        </Link>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">
          Let’s get you back in
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This link may have expired, already been used, or opened without its
          original browser session. Request a fresh link or sign in if you have
          already confirmed your account.
        </p>
        <Link
          className="mt-6 flex min-h-12 items-center justify-center rounded-lg bg-electric px-4 font-medium text-white"
          href={
            next === '/reset-password'
              ? '/forgot-password'
              : `/resend-confirmation?next=${encodeURIComponent(next)}`
          }
        >
          Request a new link
        </Link>
        <Link
          className="mt-5 block text-center text-sm underline"
          href={`/login?next=${encodeURIComponent(next === '/reset-password' ? '/portal' : next)}`}
        >
          Back to sign in
        </Link>
      </section>
    </main>
  );
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { emailVerification } from '@/lib/auth/email-flow';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { ShieldLogo } from '@/components/brand/ShieldLogo';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Confirm your email',
  robots: { index: false, follow: false },
};

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isSupabaseConfigured()) redirect('/launch-status');
  const verification = emailVerification(await searchParams);
  if (!verification) redirect('/auth/error');
  const recovery = verification.type === 'recovery';
  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 px-5 py-12">
      <section className="w-full max-w-md rounded-2xl border bg-card p-7 shadow-sm sm:p-10">
        <Link href="/">
          <ShieldLogo />
        </Link>
        <p className="mt-10 text-xs font-medium uppercase tracking-widest text-electric">
          Secure account access
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {recovery
            ? 'Continue to reset your password'
            : 'Confirm your email address'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {recovery
            ? 'Continue to choose a new password for your Aegis account.'
            : 'Confirm to finish creating your account and open your workspace.'}{' '}
          Only continue if you requested this email.
        </p>
        <form action="/auth/verify" method="post" className="mt-7">
          {Object.entries(verification).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <button className="min-h-12 w-full rounded-lg bg-electric px-4 font-medium text-white">
            {recovery ? 'Continue securely' : 'Confirm email and continue'}
          </button>
        </form>
        <Link
          href="/login"
          className="mt-5 block text-center text-sm text-muted-foreground underline"
        >
          Return to sign in
        </Link>
      </section>
    </main>
  );
}

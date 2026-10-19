import Link from 'next/link';
import { ArrowRight, LockKeyhole } from 'lucide-react';

export function AccountUnavailable() {
  return (
    <div>
      <div className="mb-6 grid h-12 w-12 place-items-center rounded-xl border bg-muted">
        <LockKeyhole className="h-5 w-5 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">
        Account access is temporarily unavailable.
      </h1>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        Sign-in and registration are not enabled on this version of Aegis yet.
        You can explore a sample assessment without creating an account.
      </p>
      <Link
        href="/demo"
        className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 text-sm font-semibold text-white"
      >
        Explore the demo <ArrowRight className="h-4 w-4" />
      </Link>
      <a
        href="/login"
        className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl border text-sm font-medium hover:bg-muted"
      >
        Check account access again
      </a>
      <p className="mt-5 text-xs leading-5 text-muted-foreground">
        Demo data is fictional. No email, password or payment details are
        collected here.
      </p>
    </div>
  );
}

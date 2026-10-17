import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default async function ResetPasswordPage() {
  const client = await createClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (!user || error)
    return (
      <div>
        <h1 className="text-2xl font-semibold">Request a fresh reset link</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Open the link in your password-reset email before choosing a new
          password. If it expired, request another.
        </p>
        <Link
          className="mt-6 block rounded-lg bg-electric px-4 py-3 text-center text-sm font-medium text-white"
          href="/forgot-password"
        >
          Send a new reset link
        </Link>
      </div>
    );
  return <ResetPasswordForm />;
}

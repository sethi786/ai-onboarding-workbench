import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/require-user';
import { InvitationAction } from '@/components/portal/InvitationActions';
export const metadata = {
  title: 'Join a workspace',
  robots: { index: false, follow: false },
};
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[a-f0-9]{36}$/.test(token)) notFound();
  const user = await requireUser(`/invite/${token}`);
  return (
    <div className="mx-auto max-w-lg px-6 py-24">
      <h1 className="text-2xl font-semibold">Join your team on Aegis</h1>
      <p className="my-6 text-sm text-muted-foreground">
        You’re signed in as {user.email}. This invitation can only be accepted
        by its intended recipient after email verification.
      </p>
      <InvitationAction token={token} />
    </div>
  );
}

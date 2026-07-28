import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { previewInvitation } from '@/lib/actions/invitations';
import { AcceptInvitationButton } from '@/components/portal/AcceptInvitationButton';

export const dynamic = 'force-dynamic';

const ROLE_BLURB: Record<string, string> = {
  owner: 'full control of the workspace, including billing.',
  admin: 'manage members, evaluations, and settings.',
  member: 'run evaluations, answer lenses, and attach evidence.',
  viewer: 'read evaluations and exports without editing them.',
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await previewInvitation(token);

  if (!invite) {
    return (
      <Shell icon={<XCircle className="h-6 w-6 text-danger" />} title="Invitation not found">
        <p>
          This link is no longer valid. Ask whoever invited you to send a fresh one from their
          workspace settings.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-electric hover:underline">
          Go to log in
        </Link>
      </Shell>
    );
  }

  if (invite.accepted) {
    return (
      <Shell icon={<CheckCircle2 className="h-6 w-6 text-electric" />} title="Already accepted">
        <p>
          This invitation to <strong className="text-foreground">{invite.orgName}</strong> has
          already been used. Log in to open the workspace.
        </p>
        <Link
          href={`/login?next=/portal/${invite.orgSlug}/dashboard`}
          className="mt-6 inline-block text-sm font-medium text-electric hover:underline"
        >
          Log in
        </Link>
      </Shell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The RPC enforces this too — checking here just lets us explain the mismatch
  // instead of failing on submit.
  const emailMatches =
    !!user?.email && user.email.toLowerCase() === invite.email.toLowerCase();

  return (
    <div>
      <h1 className="text-lg font-semibold text-foreground">
        Join {invite.orgName} on Aegis
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        You’ve been invited as a <strong className="text-foreground">{invite.role}</strong> —{' '}
        {ROLE_BLURB[invite.role] ?? 'access to the workspace.'}
      </p>

      <dl className="mt-6 space-y-2 rounded-lg border border-border bg-card p-4 text-sm">
        <Row label="Workspace" value={invite.orgName} />
        <Row label="Invited email" value={invite.email} />
        <Row label="Role" value={invite.role} />
      </dl>

      {!user ? (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Sign in as <strong className="text-foreground">{invite.email}</strong> to accept, or
            create an account with that address.
          </p>
          <div className="flex gap-2">
            <Link
              href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-electric px-4 text-sm font-medium text-white hover:opacity-90"
            >
              Log in
            </Link>
            <Link
              href={`/signup?next=${encodeURIComponent(`/invite/${token}`)}`}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-border px-4 text-sm font-medium hover:bg-muted"
            >
              Create account
            </Link>
          </div>
        </div>
      ) : emailMatches ? (
        <div className="mt-6">
          <AcceptInvitationButton token={token} orgName={invite.orgName} />
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-warning/40 bg-warning/8 p-4 text-sm">
          <p>
            You’re signed in as <strong className="text-foreground">{user.email}</strong>, but this
            invitation was sent to <strong className="text-foreground">{invite.email}</strong>. Log
            out and sign in with that address to accept it.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}

function Shell({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {icon}
      <h1 className="mt-3 text-lg font-semibold text-foreground">{title}</h1>
      <div className="mt-1 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

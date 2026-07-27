import Link from 'next/link';
import { requireUser } from '@/lib/auth/require-user';
import { listMyOrganizations } from '@/lib/auth/membership';
import { ShieldLogo } from '@/components/brand/ShieldLogo';
import { CreateOrgForm } from '@/components/portal/CreateOrgForm';

export default async function OnboardingPage() {
  await requireUser('/portal/onboarding');
  const orgs = await listMyOrganizations();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 flex justify-center">
        <Link href="/">
          <ShieldLogo />
        </Link>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-lg font-semibold">Create your workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A workspace holds your organization’s AI tool evaluations. You’ll be the owner.
        </p>
        <div className="mt-6">
          <CreateOrgForm />
        </div>
      </div>
      {orgs.length > 0 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Or go to{' '}
          <Link href={`/portal/${orgs[0].org.slug}/dashboard`} className="text-electric hover:underline">
            {orgs[0].org.name}
          </Link>
        </p>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';

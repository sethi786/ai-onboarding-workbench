import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/require-user';
import { listMyOrganizations } from '@/lib/auth/membership';

/** Entry to the portal: send the user to their first org, or onboarding. */
export default async function PortalIndex() {
  await requireUser('/portal');
  const orgs = await listMyOrganizations();
  if (orgs.length === 0) redirect('/portal/onboarding');
  redirect(`/portal/${orgs[0].org.slug}/dashboard`);
}

import { requireUser } from '@/lib/auth/require-user';
import { requireMembership, listMyOrganizations } from '@/lib/auth/membership';
import { PortalSidebar } from '@/components/portal/PortalSidebar';
import { PortalHeader } from '@/components/portal/PortalHeader';
import { OrgProvider } from '@/components/portal/OrgProvider';

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const user = await requireUser(`/portal/${orgSlug}/dashboard`);
  const { org, role } = await requireMembership(orgSlug);
  const orgs = await listMyOrganizations();

  return (
    <OrgProvider value={{ orgId: org.id, orgSlug: org.slug, orgName: org.name, role }}>
      <div className="grid min-h-screen grid-cols-[248px_1fr] bg-muted/30 max-md:grid-cols-1">
        <PortalSidebar orgSlug={org.slug} role={role} />
        <div className="flex min-w-0 flex-col">
          <PortalHeader
            orgs={orgs.map((o) => ({ slug: o.org.slug, name: o.org.name }))}
            activeSlug={org.slug}
            orgName={org.name}
            role={role}
            userEmail={user.email ?? ''}
          />
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </OrgProvider>
  );
}

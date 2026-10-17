import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/require-user';
import { listMyOrganizations } from '@/lib/auth/membership';
import { TOOL_TEMPLATE_BY_ID } from '@/data/tool-templates';
export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template = '' } = await searchParams;
  const selected = TOOL_TEMPLATE_BY_ID[template];
  if (!selected) notFound();
  await requireUser(`/portal/start?template=${encodeURIComponent(template)}`);
  const orgs = await listMyOrganizations();
  if (!orgs.length)
    redirect(`/portal/onboarding?template=${encodeURIComponent(template)}`);
  const target = (slug: string) =>
    `/portal/${slug}/library?template=${encodeURIComponent(template)}`;
  if (orgs.length === 1) redirect(target(orgs[0].org.slug));
  return (
    <div className="mx-auto max-w-xl px-6 py-20">
      <h1 className="text-2xl font-semibold">
        Where should {selected.name} go?
      </h1>
      <p className="mt-3 text-muted-foreground">
        Choose a workspace to continue.
      </p>
      <div className="mt-8 space-y-3">
        {orgs.map(({ org }) => (
          <Link
            className="block rounded-lg border border-border p-4 hover:bg-muted"
            href={target(org.slug)}
            key={org.id}
          >
            {org.name} →
          </Link>
        ))}
      </div>
    </div>
  );
}

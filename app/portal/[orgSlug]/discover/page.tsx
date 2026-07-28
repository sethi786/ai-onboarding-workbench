import { requireMembership } from '@/lib/auth/membership';
import { aiPolicyFor } from '@/lib/ai/governance';
import { DiscoverClient } from '@/components/portal/DiscoverClient';

export default async function DiscoverPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org } = await requireMembership(orgSlug);
  const aiPolicy = await aiPolicyFor(org.id);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="display-md">Discover what you&rsquo;re running</h1>
      <p className="mb-6 mt-1 max-w-2xl text-sm text-muted-foreground">
        Most organizations can&rsquo;t list their own tools — the majority of SaaS and AI runs
        outside IT&rsquo;s view. Start from a list you already have rather than from memory, and get
        back a queue ordered by what actually needs reviewing first.
      </p>
      <DiscoverClient orgId={org.id} orgSlug={orgSlug} aiAvailable={aiPolicy.allowed} />
    </div>
  );
}

export const dynamic = 'force-dynamic';

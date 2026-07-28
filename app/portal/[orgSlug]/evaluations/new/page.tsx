import { requireMembership } from '@/lib/auth/membership';
import { aiPolicyFor } from '@/lib/ai/governance';
import { EvaluationForm } from '@/components/portal/EvaluationForm';

export default async function NewEvaluationPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org } = await requireMembership(orgSlug);
  const aiPolicy = await aiPolicyFor(org.id);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">New evaluation</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Describe the tool you’re adopting. What you record here decides which review lenses apply,
        so it’s worth a couple of minutes.
      </p>
      <EvaluationForm orgId={org.id} orgSlug={orgSlug} aiAvailable={aiPolicy.allowed} />
    </div>
  );
}

import { requireMembership } from '@/lib/auth/membership';
import { EvaluationForm } from '@/components/portal/EvaluationForm';

export default async function NewEvaluationPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org } = await requireMembership(orgSlug);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">New evaluation</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Describe the AI tool you’re onboarding. Capability flags determine which review lenses apply.
      </p>
      <EvaluationForm orgId={org.id} orgSlug={orgSlug} />
    </div>
  );
}

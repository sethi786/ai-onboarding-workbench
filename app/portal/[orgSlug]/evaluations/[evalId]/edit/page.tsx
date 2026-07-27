import { notFound } from 'next/navigation';
import { requireMembership } from '@/lib/auth/membership';
import { getEvaluation, rowToProfile } from '@/lib/db/queries';
import { EvaluationForm } from '@/components/portal/EvaluationForm';

export default async function EditEvaluationPage({
  params,
}: {
  params: Promise<{ orgSlug: string; evalId: string }>;
}) {
  const { orgSlug, evalId } = await params;
  const { org } = await requireMembership(orgSlug);
  const row = await getEvaluation(evalId);
  if (!row) notFound();

  return (
    <div className="max-w-3xl">
      <EvaluationForm orgId={org.id} orgSlug={orgSlug} evalId={evalId} initial={rowToProfile(row)} />
    </div>
  );
}

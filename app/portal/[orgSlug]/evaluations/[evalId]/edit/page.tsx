import { notFound } from 'next/navigation';
import { requireMembership } from '@/lib/auth/membership';
import { getEvaluation, rowToProfile } from '@/lib/db/queries';
import { canDeleteEvaluation } from '@/lib/rbac';
import { EvaluationForm } from '@/components/portal/EvaluationForm';
import { DeleteEvaluationButton } from '@/components/portal/DeleteEvaluationButton';

export default async function EditEvaluationPage({
  params,
}: {
  params: Promise<{ orgSlug: string; evalId: string }>;
}) {
  const { orgSlug, evalId } = await params;
  const { org, role } = await requireMembership(orgSlug);
  const row = await getEvaluation(evalId);
  if (!row) notFound();

  return (
    <div className="max-w-3xl space-y-8">
      <EvaluationForm orgId={org.id} orgSlug={orgSlug} evalId={evalId} initial={rowToProfile(row)} />

      {canDeleteEvaluation(role) && (
        <section className="rounded-xl border border-danger/25 bg-danger/[0.03] p-6">
          <h2 className="text-sm font-semibold">Danger zone</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Deleting removes the evaluation, its lens assessments, workflow, and saved reports. This
            cannot be undone — and it frees an evaluation slot on capped plans.
          </p>
          <div className="mt-4">
            <DeleteEvaluationButton evalId={evalId} orgSlug={orgSlug} evalName={row.name} />
          </div>
        </section>
      )}
    </div>
  );
}

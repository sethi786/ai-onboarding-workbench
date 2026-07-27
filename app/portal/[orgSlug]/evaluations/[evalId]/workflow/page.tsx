import { requireMembership } from '@/lib/auth/membership';
import { getWorkflow } from '@/lib/db/queries';
import { canEdit } from '@/lib/rbac';
import { WorkflowTable } from '@/components/portal/WorkflowTable';

export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ orgSlug: string; evalId: string }>;
}) {
  const { orgSlug, evalId } = await params;
  const { role } = await requireMembership(orgSlug);
  const stages = await getWorkflow(evalId);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        The end-to-end onboarding lifecycle — intake to retirement. Track status, owner, due date,
        and decision per stage.
      </p>
      <WorkflowTable stages={stages} evalId={evalId} orgSlug={orgSlug} canEdit={canEdit(role)} />
    </div>
  );
}

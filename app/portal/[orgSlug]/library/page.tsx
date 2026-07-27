import { requireMembership } from '@/lib/auth/membership';
import { canEdit } from '@/lib/rbac';
import { TOOL_TEMPLATES } from '@/data/tool-templates';
import { Badge } from '@/components/ui/badge';
import { InstantiateButton } from '@/components/portal/InstantiateButton';

export default async function LibraryPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org, role } = await requireMembership(orgSlug);
  const editable = canEdit(role);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight">AI Tool Library</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Prefilled templates for the world’s major AI tools. Add one to your workspace to start a
        pre-populated evaluation with suggested answers.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TOOL_TEMPLATES.map((t) => {
          const flags = [
            t.defaults.agentEnabled && 'Agent',
            t.defaults.connectorEnabled && 'Connector',
            t.defaults.ragEnabled && 'RAG',
            t.defaults.pii && 'PII',
            t.defaults.clientData && 'Client data',
            t.defaults.autonomousActions && 'Autonomous',
          ].filter(Boolean) as string[];
          return (
            <div key={t.id} className="flex flex-col rounded-lg border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="text-xs text-muted-foreground">{t.vendor}</p>
                </div>
                <Badge tone="neutral">{t.category}</Badge>
              </div>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{t.summary}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {flags.map((f) => (
                  <span key={f} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {f}
                  </span>
                ))}
              </div>
              <div className="mt-4">
                <InstantiateButton orgId={org.id} orgSlug={orgSlug} templateId={t.id} disabled={!editable} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

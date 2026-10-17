import { requireMembership } from '@/lib/auth/membership';
import { canEdit } from '@/lib/rbac';
import { TOOL_TEMPLATE_BY_ID } from '@/data/tool-templates';
import { ASSESSMENT_TEMPLATES } from '@/data/assessment-templates';
import { ToolCatalogue } from '@/components/catalogue/ToolCatalogue';
import { InstantiateButton } from '@/components/portal/InstantiateButton';
export default async function LibraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ template?: string }>;
}) {
  const { orgSlug } = await params;
  const { template = '' } = await searchParams;
  const { org, role } = await requireMembership(orgSlug);
  const editable = canEdit(role);
  const selected = TOOL_TEMPLATE_BY_ID[template];
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold">Tool & assessment library</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Start from a tool or a use case. Confirm suggested scope before
        reviewing. No score, control, evidence, or approval is marked complete
        for you.
      </p>
      {selected && (
        <section className="mt-6 rounded-xl border border-electric/30 bg-electric/5 p-6">
          <p className="text-xs uppercase text-electric">
            Your selected starter
          </p>
          <h2 className="mt-2 text-xl font-semibold">{selected.name}</h2>
          <p className="my-4 text-sm text-muted-foreground">
            {selected.summary}
          </p>
          <InstantiateButton
            orgId={org.id}
            orgSlug={orgSlug}
            templateId={selected.id}
            disabled={!editable}
          />
        </section>
      )}
      <section className="my-8">
        <h2 className="mb-4 text-lg font-semibold">Assessment scenarios</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ASSESSMENT_TEMPLATES.map((t) => (
            <article
              key={t.id}
              className="rounded-xl border border-border bg-card p-5"
            >
              <h3 className="font-semibold">{t.name}</h3>
              <p className="my-3 text-xs text-muted-foreground">{t.summary}</p>
              <InstantiateButton
                orgId={org.id}
                orgSlug={orgSlug}
                templateId={t.id}
                disabled={!editable}
              />
            </article>
          ))}
        </div>
      </section>
      <ToolCatalogue workspace={{ id: org.id, slug: orgSlug, editable }} />
    </div>
  );
}

import { notFound } from 'next/navigation';
import { requireMembership } from '@/lib/auth/membership';
import { getEvaluation } from '@/lib/db/queries';
import { EvalTabs } from '@/components/portal/EvalTabs';

export default async function EvaluationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string; evalId: string }>;
}) {
  const { orgSlug, evalId } = await params;
  const { org } = await requireMembership(orgSlug);
  const evalRow = await getEvaluation(evalId);
  if (!evalRow || evalRow.org_id !== org.id) notFound();

  return (
    <div className="mx-auto max-w-6xl">
      {/* Mastheads carry the display serif, so the app reads as the same
          product as the site the customer arrived from. Two halves in two
          typefaces is what makes a SaaS feel stitched together. */}
      <div className="mb-1.5 flex items-center gap-2 text-[13px] text-muted-foreground">
        <span>{evalRow.platform || 'AI tool'}</span>
        <span>·</span>
        <span>{evalRow.environment}</span>
      </div>
      <h1 className="display-md">{evalRow.name}</h1>
      <EvalTabs orgSlug={orgSlug} evalId={evalId} />
      <div className="mt-6">{children}</div>
    </div>
  );
}

export const dynamic = 'force-dynamic';

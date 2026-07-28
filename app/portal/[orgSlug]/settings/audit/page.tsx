import { requireMembership } from '@/lib/auth/membership';
import { listAuditEvents } from '@/lib/audit';
import { AuditExportButton } from '@/components/portal/AuditExportButton';
import { Badge } from '@/components/ui/badge';

const TONE: Record<string, 'danger' | 'warning' | 'electric' | 'trust' | 'neutral'> = {
  'evaluation.deleted': 'danger',
  'ai.refused': 'warning',
  'assessment.decided': 'electric',
  'ai.invoked': 'trust',
};

export default async function AuditPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org } = await requireMembership(orgSlug);
  const events = await listAuditEvents(org.id, { limit: 300 });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">Audit trail</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Who did what, and when. Append-only at the database level — there is no update or
              delete path, including for owners, because a record the actors can rewrite is not
              evidence.
            </p>
          </div>
          <AuditExportButton events={events} orgSlug={orgSlug} />
        </div>
      </div>

      {events.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nothing recorded yet. Events appear here as your team creates evaluations, records
          decisions, and uses AI assistance.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {['When', 'Who', 'Action', 'What happened'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0 align-top">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{e.actor_email ?? 'system'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={TONE[e.action] ?? 'neutral'}>{e.action}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {e.summary}
                      {e.action === 'ai.invoked' && (
                        <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                          {String(e.metadata.provider ?? '')} · {String(e.metadata.model ?? '')} ·{' '}
                          {String(e.metadata.inputChars ?? 0)} chars · sha256{' '}
                          {String(e.metadata.inputSha256 ?? '').slice(0, 16)}…
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';

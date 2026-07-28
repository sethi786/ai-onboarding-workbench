'use client';

import { toast } from 'sonner';
import { Download } from 'lucide-react';
import { download } from '@/workbench/export/download';
import { auditToCsv, type AuditEvent } from '@/lib/audit-format';

/**
 * The trail, out of the product.
 *
 * An auditor who cannot take the evidence away with them does not count it as
 * evidence — so this is a plain CSV, not a formatted report.
 */
export function AuditExportButton({
  events,
  orgSlug,
}: {
  events: AuditEvent[];
  orgSlug: string;
}) {
  return (
    <button
      type="button"
      disabled={events.length === 0}
      onClick={() => {
        download(`${orgSlug}-audit-trail.csv`, 'text/csv', auditToCsv(events));
        toast.success(`Exported ${events.length} events`);
      }}
      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-muted disabled:opacity-50"
    >
      <Download className="h-4 w-4" /> Export CSV
    </button>
  );
}

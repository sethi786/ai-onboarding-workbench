/**
 * The pure half of the audit trail: the record shape and the CSV writer.
 *
 * Split out from lib/audit.ts because that module is `server-only` — it holds
 * the Supabase client — and the export button is a client component. Keeping
 * the formatter here lets the browser format a file without pulling a database
 * client into the bundle.
 */

export interface AuditEvent {
  id: string;
  actor_email: string | null;
  action: string;
  subject_type: string | null;
  subject_id: string | null;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * CSV for the auditor who wants it outside the product.
 *
 * Cells are guarded against formula injection. Excel and Sheets execute any
 * cell beginning with =, +, -, or @, and this file is built from names and
 * notes a user controls — so an evaluation called `=cmd|'/c calc'!A0` would run
 * on the auditor's machine when they opened the export. Prefixing with a single
 * quote neutralises it and is invisible in the spreadsheet.
 */
export function auditToCsv(events: AuditEvent[]): string {
  const cell = (v: unknown) => {
    const raw = String(v ?? '');
    const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const header = ['Timestamp', 'Actor', 'Action', 'Subject', 'Summary', 'Detail'];
  const rows = events.map((e) =>
    [
      e.created_at,
      e.actor_email ?? 'system',
      e.action,
      [e.subject_type, e.subject_id].filter(Boolean).join(':'),
      e.summary,
      JSON.stringify(e.metadata ?? {}),
    ]
      .map(cell)
      .join(','),
  );
  return [header.map(cell).join(','), ...rows].join('\n');
}

import type { ReportContext } from './reportContext';

/**
 * Quote a cell, and neutralise spreadsheet formula injection.
 *
 * Excel and Sheets execute any cell beginning with =, +, -, or @. The tool name
 * and reviewer's own name land in this file, so an evaluation called
 * `=cmd|'/c calc'!A0` would run on whoever opens the export. A leading
 * apostrophe stops that and is invisible in the spreadsheet.
 */
function esc(v: string | number): string {
  const raw = String(v);
  const s = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return /[",\n']/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(ctx: ReportContext): string {
  const header = [
    'Profile',
    'Team',
    'Required',
    'Escalated',
    'Score',
    'ReadinessPct',
    'ControlsComplete',
    'ControlsTotal',
    'EvidenceComplete',
    'EvidenceTotal',
    'ActiveBlockers',
    'Decision',
    'Owner',
    'DueDate',
  ];
  const rows = ctx.teams.map((t) =>
    [
      ctx.profile.name,
      t.lens.title,
      t.required ? 'Yes' : 'No',
      t.escalated ? 'Yes' : 'No',
      t.assessment.score < 0 ? '' : t.assessment.score,
      t.normalized,
      t.controlsComplete,
      t.controlsTotal,
      t.evidenceComplete,
      t.evidenceTotal,
      t.activeBlockerLabels.length,
      t.assessment.decision,
      t.assessment.owner,
      t.assessment.dueDate,
    ]
      .map(esc)
      .join(','),
  );
  return [header.join(','), ...rows].join('\n');
}

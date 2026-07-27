import type { ReportContext } from './reportContext';

function esc(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
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

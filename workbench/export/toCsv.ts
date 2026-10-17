import type { ReportContext } from './reportContext';

function esc(v: string | number): string {
  const raw = String(v);
  // Prevent spreadsheet software from treating user text as a formula.
  const s = typeof v === 'string' && /^[\s]*[=+@-]/.test(raw) ? `'${raw}` : raw;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(ctx: ReportContext): string {
  const header = [
    'MethodologyVersion',
    'EvaluatedAt',
    'SelfReportedDecisionStatus',
    'Recommendation',
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
      ctx.score.methodologyVersion,
      ctx.score.evaluatedAt,
      ctx.score.approvalStatus,
      ctx.score.recommendation,
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

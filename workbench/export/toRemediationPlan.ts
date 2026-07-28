import type { ReportContext } from './reportContext';
import { headerMeta } from './reportContext';
import { documentHeaderLines, documentFooterLines } from './documentHeader';

export function toRemediationPlan(ctx: ReportContext): string {
  const { teams } = ctx;
  const items = teams.filter(
    (t) =>
      t.required &&
      (t.activeBlockerLabels.length > 0 ||
        t.assessment.needsRemediation ||
        t.missingEvidence.length > 0 ||
        t.controlsComplete < t.controlsTotal),
  );

  const lines = documentHeaderLines('Remediation Plan', ctx.brand, headerMeta(ctx));

  if (items.length === 0) {
    lines.push('No open remediation items for required teams.');
    lines.push('');
    lines.push(...documentFooterLines(ctx.brand));
    return lines.join('\n');
  }

  lines.push('| Team | Gap | Owner | Due | Suggested Actions |');
  lines.push('|---|---|---|---|---|');
  for (const t of items) {
    const gaps: string[] = [];
    if (t.activeBlockerLabels.length) gaps.push(`Blockers: ${t.activeBlockerLabels.join('; ')}`);
    if (t.controlsComplete < t.controlsTotal)
      gaps.push(`${t.controlsTotal - t.controlsComplete} controls open`);
    if (t.missingEvidence.length) gaps.push(`Missing evidence: ${t.missingEvidence.join('; ')}`);
    lines.push(
      `| ${t.lens.title} | ${gaps.join(' · ')} | ${t.assessment.owner || '—'} | ${
        t.assessment.dueDate || '—'
      } | ${t.lens.remediation.join('; ')} |`,
    );
  }
  lines.push('');
  lines.push(...documentFooterLines(ctx.brand));
  return lines.join('\n');
}

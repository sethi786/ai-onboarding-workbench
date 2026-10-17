import { METHODOLOGY_NOTE } from '../engine/scoring';
import type { ReportContext } from './reportContext';
import { DRAFT_BANNER } from '../data/constants';

export function toRemediationPlan(ctx: ReportContext): string {
  const { profile, teams } = ctx;
  const items = teams.filter(
    (t) =>
      t.required &&
      ctx.score.perTeam[t.lens.id].gateReasons.length > 0,
  );

  const lines: string[] = [];
  lines.push('# Remediation Plan');
  lines.push('');
  lines.push(`Methodology: ${ctx.score.methodologyVersion} · Evaluated: ${ctx.score.evaluatedAt}`);
  lines.push(METHODOLOGY_NOTE);
  lines.push('');
  lines.push(`> ${DRAFT_BANNER}`);
  lines.push('');
  lines.push(`**Profile:** ${profile.name}`);
  lines.push(`**Generated:** ${ctx.generatedAt}`);
  lines.push('');

  if (items.length === 0) {
    lines.push('No open remediation items for required teams. 🎉');
    return lines.join('\n');
  }

  lines.push('| Team | Gap | Owner | Due | Suggested Actions |');
  lines.push('|---|---|---|---|---|');
  for (const t of items) {
    const gaps: string[] = [...ctx.score.perTeam[t.lens.id].gateReasons];
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
  return lines.join('\n');
}

import type { ReportContext } from './reportContext';
import { DRAFT_BANNER } from '../data/constants';

export function toGoNoGoReport(ctx: ReportContext): string {
  const { profile, score, teams } = ctx;
  const req = teams.filter((t) => t.required);
  const blocked = req.filter((t) => t.hasCriticalBlocker || t.activeBlockerLabels.length > 0);
  const notReady = req.filter((t) => t.normalized < 70 && !t.hasCriticalBlocker);

  const lines: string[] = [];
  lines.push('# Go / No-Go Decision Pack');
  lines.push('');
  lines.push(`> ${DRAFT_BANNER}`);
  lines.push('');
  lines.push(`**Profile:** ${profile.name} — ${profile.platform} (${profile.environment})`);
  lines.push(`**Generated:** ${ctx.generatedAt}`);
  lines.push('');
  lines.push('## Recommendation');
  lines.push('');
  lines.push(`# ${score.recommendation}`);
  lines.push('');
  lines.push(`- Overall Readiness: **${score.readiness}/100**`);
  lines.push(`- Overall Risk: **${score.risk}**`);
  lines.push(`- Evidence Complete: **${score.evidenceCompleteness}%**`);
  lines.push(`- Required teams: ${score.requiredTeams} · Ready: ${score.teamsReady} · Blocked: ${score.teamsBlocked}`);
  lines.push('');

  lines.push('## Blocking Items');
  lines.push('');
  if (blocked.length === 0) {
    lines.push('None.');
  } else {
    for (const t of blocked) {
      lines.push(`- **${t.lens.title}:** ${t.activeBlockerLabels.join(', ') || 'blocked decision'}`);
    }
  }
  lines.push('');

  lines.push('## Teams Not Yet Ready (< 70%)');
  lines.push('');
  if (notReady.length === 0) {
    lines.push('All required teams are at or above the conditional-approval threshold.');
  } else {
    for (const t of notReady) {
      lines.push(`- ${t.lens.title}: ${t.normalized}% ready`);
    }
  }
  lines.push('');

  lines.push('## Required Sign-Off Snapshot');
  lines.push('');
  lines.push('| Team | Decision | Readiness |');
  lines.push('|---|---|---|');
  for (const t of req) {
    lines.push(`| ${t.lens.title} | ${t.assessment.decision} | ${t.normalized}% |`);
  }
  lines.push('');
  return lines.join('\n');
}

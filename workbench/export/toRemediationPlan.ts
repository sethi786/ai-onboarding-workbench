import type { ReportContext } from './reportContext';
import { headerMeta } from './reportContext';
import { documentHeaderLines, documentFooterLines } from './documentHeader';
import { CONTROL_GUIDANCE, EVIDENCE_GUIDANCE } from '../data/controlGuidance';

/**
 * The list of things still to do, written so somebody can act on it.
 *
 * This used to say "6 controls open" and leave the reader to work out which
 * six, then hand them the lens's generic remediation advice. A plan that
 * doesn't name the gap isn't a plan. Every open item is now listed by name with
 * the concrete test for closing it, so the document can be forwarded to the
 * person who has to do the work without a covering conversation.
 */
export function toRemediationPlan(ctx: ReportContext): string {
  const { teams } = ctx;
  const items = teams.filter(
    (t) =>
      t.required &&
      (t.activeBlockerLabels.length > 0 ||
        t.assessment.needsRemediation ||
        t.missingEvidence.length > 0 ||
        t.missingControls.length > 0),
  );

  const lines = documentHeaderLines('Remediation Plan', ctx.brand, headerMeta(ctx));

  if (items.length === 0) {
    lines.push('No open remediation items for required teams.');
    lines.push('');
    lines.push(...documentFooterLines(ctx.brand));
    return lines.join('\n');
  }

  const open = items.reduce(
    (n, t) => n + t.missingControls.length + t.missingEvidence.length + t.activeBlockerLabels.length,
    0,
  );
  lines.push(
    `${open} open item${open === 1 ? '' : 's'} across ${items.length} review${items.length === 1 ? '' : 's'}. ` +
      'Only what each review asks for at its assigned depth is listed.',
  );
  lines.push('');

  for (const t of items) {
    lines.push(`## ${t.lens.title}`);
    lines.push('');
    const meta = [
      `Status: ${t.assessment.decision === 'Not Reviewed' ? 'not started' : t.assessment.decision}`,
      `Depth: ${ctx.score.perTeam[t.lens.id]?.depth ?? 'Standard'}`,
      `Owner: ${t.assessment.owner || 'unassigned'}`,
      `Due: ${t.assessment.dueDate || 'not set'}`,
    ];
    lines.push(`_${meta.join(' · ')}_`);
    lines.push('');

    if (t.activeBlockerLabels.length) {
      lines.push('**Blocking**');
      lines.push('');
      for (const b of t.activeBlockerLabels) lines.push(`- ${b}`);
      lines.push('');
    }

    if (t.missingControls.length) {
      lines.push('**Controls to close**');
      lines.push('');
      for (const c of t.missingControls) {
        const done = CONTROL_GUIDANCE[c.id];
        lines.push(`- **${c.label}**${c.critical ? ' _(critical)_' : ''}${done ? ` — ${done}` : ''}`);
      }
      lines.push('');
    }

    if (t.missingEvidenceItems.length) {
      lines.push('**Evidence to collect**');
      lines.push('');
      for (const e of t.missingEvidenceItems) {
        const where = EVIDENCE_GUIDANCE[e.id];
        lines.push(`- **${e.label}**${where ? ` — ${where}` : ''}`);
      }
      lines.push('');
    }

    if (t.lens.remediation.length) {
      lines.push(`_Typical fixes: ${t.lens.remediation.join('; ')}_`);
      lines.push('');
    }
  }

  lines.push(...documentFooterLines(ctx.brand));
  return lines.join('\n');
}

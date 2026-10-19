import { METHODOLOGY_NOTE } from '../engine/scoring';
import type { ReportContext } from './reportContext';
import { DISCLAIMER } from '../data/constants';

export function toMarkdownReport(ctx: ReportContext): string {
  const { profile, score, teams } = ctx;
  const req = teams.filter((t) => t.required);

  const lines: string[] = [];
  lines.push('# AI Onboarding Self-Evaluation Report');
  lines.push('');
  lines.push(`Methodology: ${ctx.score.methodologyVersion} · Evaluated: ${ctx.score.evaluatedAt}`);
  lines.push(METHODOLOGY_NOTE);
  lines.push('');
  lines.push(`> ${DISCLAIMER}`);
  lines.push('');
  lines.push(`_Generated: ${ctx.generatedAt}_`);
  lines.push('');
  lines.push('## Profile');
  lines.push('');
  lines.push(`- **Profile Name:** ${profile.name}`);
  lines.push(`- **Platform:** ${profile.platform}`);
  lines.push(`- **Tool Type:** ${profile.toolType}`);
  lines.push(`- **Use Case:** ${profile.useCase || '—'}`);
  lines.push(`- **Business Owner:** ${profile.businessOwner || '—'}`);
  lines.push(`- **Technical Owner:** ${profile.technicalOwner || '—'}`);
  lines.push(`- **Executive Sponsor:** ${profile.executiveSponsor || '—'}`);
  lines.push(`- **Environment:** ${profile.environment}`);
  lines.push(`- **Data Classification:** ${profile.dataClassification}`);
  lines.push(`- **Data Types:** ${profile.dataTypes.join(', ') || '—'}`);
  lines.push(
    `- **Flags:** ${[
      profile.agentEnabled && 'Agent',
      profile.connectorEnabled && 'Connector',
      profile.ragEnabled && 'RAG',
      profile.pii && 'PII',
      profile.clientData && 'Client Data',
      profile.autonomousActions && 'Autonomous',
      profile.externalVendor && 'External Vendor',
    ]
      .filter(Boolean)
      .join(', ') || 'None'}`,
  );
  lines.push('');
  lines.push('## Overall');
  lines.push('');
  lines.push(`- **Overall Readiness:** ${score.readiness}/100`);
  lines.push(`- **Overall Risk:** ${score.risk}`);
  lines.push(`- **Self-reported decision status:** ${score.approvalStatus}`);
  lines.push(`- **Final Recommendation:** ${score.recommendation}`);
  lines.push(`- **Evidence supported:** ${score.evidenceCompleteness}%`);
  lines.push(`- **Blockers:** ${score.blockersCount}`);
  lines.push(
    `- **Teams Ready / Blocked:** ${score.teamsReady} / ${score.teamsBlocked} (of ${score.requiredTeams} required)`,
  );
  lines.push('');

  lines.push('## Team-by-Team Status');
  lines.push('');
  lines.push('| Team | Required | Score | Readiness | Controls | Evidence | Decision | Blockers |');
  lines.push('|---|---|---|---|---|---|---|---|');
  for (const t of teams) {
    lines.push(
      `| ${t.lens.title} | ${t.required ? 'Yes' : 'No'} | ${
        t.assessment.score < 0 ? '—' : t.assessment.score + '/5'
      } | ${t.normalized}% | ${t.controlsComplete}/${t.controlsTotal} | ${t.evidenceComplete}/${
        t.evidenceTotal
      } | ${t.assessment.decision} | ${t.activeBlockerLabels.length} |`,
    );
  }
  lines.push('');

  const missing = req.filter((t) => t.missingEvidence.length > 0);
  lines.push('## Missing Evidence');
  lines.push('');
  if (missing.length === 0) {
    lines.push('All required evidence items have current references. Document content has not been independently verified.');
  } else {
    for (const t of missing) {
      lines.push(`- **${t.lens.title}:** ${t.missingEvidence.join(', ')}`);
    }
  }
  lines.push('');

  const remediation = req.filter(
    (t) => score.perTeam[t.lens.id].gateReasons.length > 0,
  );
  lines.push('## Remediation Plan');
  lines.push('');
  if (remediation.length === 0) {
    lines.push('No open remediation items.');
  } else {
    for (const t of remediation) {
      lines.push(`### ${t.lens.title}`);
      lines.push(...score.perTeam[t.lens.id].gateReasons.map((reason) => `- ${reason}`));
      if (t.activeBlockerLabels.length)
        lines.push(`- Active blockers: ${t.activeBlockerLabels.join(', ')}`);
      if (t.assessment.owner) lines.push(`- Owner: ${t.assessment.owner}`);
      if (t.assessment.dueDate) lines.push(`- Due: ${t.assessment.dueDate}`);
      lines.push(`- Suggested actions: ${t.lens.remediation.join('; ')}`);
      lines.push('');
    }
  }

  lines.push('## Final Recommendation');
  lines.push('');
  lines.push(`**${score.recommendation}**`);
  lines.push('');
  lines.push('## Next actions', '', ...score.gateReasons.map((reason) => `- ${reason}`), '');
  return lines.join('\n');
}

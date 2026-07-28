import type { ReportContext, TeamReportRow } from './reportContext';
import type { TeamId } from '../types';
import { headerMeta } from './reportContext';
import { documentHeaderLines } from './documentHeader';
import { toGoNoGoReport } from './toGoNoGoReport';

function header(title: string, ctx: ReportContext): string[] {
  return documentHeaderLines(title, ctx.brand, headerMeta(ctx));
}

function teamRow(ctx: ReportContext, teamId: TeamId): TeamReportRow {
  return ctx.teams.find((t) => t.lens.id === teamId)!;
}

/** Generic evidence pack built from a team lens + the user's self-assessment. */
function teamArtifact(ctx: ReportContext, teamId: TeamId, title: string): string {
  const t = teamRow(ctx, teamId);
  const a = t.assessment;
  const lines = header(title, ctx);

  lines.push('## Review Purpose');
  lines.push('', t.lens.reviewPurpose, '');

  lines.push('## Self-Assessment Snapshot');
  lines.push('');
  lines.push(`- Readiness score: ${a.score < 0 ? 'Not scored' : a.score + '/5'} (${t.normalized}% weighted)`);
  lines.push(`- Decision: ${a.decision}`);
  lines.push(`- Owner: ${a.owner || '—'} · Due: ${a.dueDate || '—'}`);
  lines.push(`- Controls complete: ${t.controlsComplete}/${t.controlsTotal}`);
  lines.push(`- Evidence attached: ${t.evidenceComplete}/${t.evidenceTotal}`);
  if (a.residualRisk) lines.push(`- Residual risk: ${a.residualRisk}`);
  if (a.notes) lines.push(`- Notes: ${a.notes}`);
  lines.push('');

  lines.push('## Required Controls');
  lines.push('');
  for (const c of t.lens.requiredControls) {
    lines.push(`- [${a.checkedControls[c.id] ? 'x' : ' '}] ${c.label}${c.critical ? ' (critical)' : ''}`);
  }
  lines.push('');

  lines.push('## Evidence Checklist');
  lines.push('');
  for (const e of t.lens.evidenceRequired) {
    lines.push(`- [${a.checkedEvidence[e.id] ? 'x' : ' '}] ${e.label}`);
  }
  lines.push('');

  if (a.evidenceLinks.length) {
    lines.push('## Evidence Links');
    lines.push('');
    for (const l of a.evidenceLinks) lines.push(`- ${l.label || 'Link'}: ${l.url}`);
    lines.push('');
  }

  if (t.activeBlockerLabels.length) {
    lines.push('## Active Blockers');
    lines.push('');
    for (const b of t.activeBlockerLabels) lines.push(`- ${b}`);
    lines.push('');
  }

  lines.push('## Pass Criteria');
  lines.push('', ...t.lens.passCriteria.map((c) => `- ${c}`), '');

  lines.push('## Suggested Remediation');
  lines.push('', ...t.lens.remediation.map((c) => `- ${c}`), '');

  return lines.join('\n');
}

function businessCaseSummary(ctx: ReportContext): string {
  const p = ctx.profile;
  const lines = header('Business Case Summary', ctx);
  lines.push('## Overview');
  lines.push('');
  lines.push(`- Use case: ${p.useCase || '—'}`);
  lines.push(`- Business owner: ${p.businessOwner || '—'}`);
  lines.push(`- Technical owner: ${p.technicalOwner || '—'}`);
  lines.push(`- Executive sponsor: ${p.executiveSponsor || '—'}`);
  lines.push(`- Target users: ${p.targetUsers || '—'}`);
  lines.push('');
  lines.push('## Overall Readiness');
  lines.push('');
  lines.push(`- Readiness: ${ctx.score.readiness}/100`);
  lines.push(`- Risk: ${ctx.score.risk}`);
  lines.push(`- Recommendation: ${ctx.score.recommendation}`);
  lines.push('');
  return lines.join('\n') + '\n' + teamArtifact(ctx, 'business', 'Business Review Detail');
}

function aiIntakeForm(ctx: ReportContext): string {
  const p = ctx.profile;
  const lines = header('AI Intake Form', ctx);
  lines.push('## Intake Details');
  lines.push('');
  lines.push(`| Field | Value |`);
  lines.push(`|---|---|`);
  lines.push(`| Name | ${p.name} |`);
  lines.push(`| Platform | ${p.platform} |`);
  lines.push(`| Tool type | ${p.toolType} |`);
  lines.push(`| Model | ${p.model || '—'} |`);
  lines.push(`| Environment | ${p.environment} |`);
  lines.push(`| Data classification | ${p.dataClassification} |`);
  lines.push(`| Data types | ${p.dataTypes.join(', ') || '—'} |`);
  lines.push(`| Agent | ${p.agentEnabled ? 'Yes' : 'No'} |`);
  lines.push(`| Connector | ${p.connectorEnabled ? 'Yes' : 'No'} |`);
  lines.push(`| RAG | ${p.ragEnabled ? 'Yes' : 'No'} |`);
  lines.push(`| PII | ${p.pii ? 'Yes' : 'No'} |`);
  lines.push(`| Client data | ${p.clientData ? 'Yes' : 'No'} |`);
  lines.push(`| Autonomous actions | ${p.autonomousActions ? 'Yes' : 'No'} |`);
  lines.push(`| External vendor | ${p.externalVendor ? 'Yes' : 'No'} |`);
  lines.push('');
  return lines.join('\n');
}

function architectureReviewSummary(ctx: ReportContext): string {
  return (
    teamArtifact(ctx, 'enterprise-architecture', 'Architecture Review Summary') +
    '\n\n---\n\n' +
    teamArtifact(ctx, 'solution-architecture', 'Solution Architecture Detail')
  );
}

function executiveDashboardReport(ctx: ReportContext): string {
  const { score } = ctx;
  const lines = header('Executive Dashboard Report', ctx);
  lines.push('## Key Metrics');
  lines.push('');
  lines.push(`- Overall Readiness: **${score.readiness}/100**`);
  lines.push(`- Overall Risk: **${score.risk}**`);
  lines.push(`- Approval Status: **${score.approvalStatus}**`);
  lines.push(`- Recommendation: **${score.recommendation}**`);
  lines.push(`- Evidence Complete: **${score.evidenceCompleteness}%**`);
  lines.push(`- Blockers: **${score.blockersCount}**`);
  lines.push(`- Controls Complete / Remaining: **${score.controlsComplete} / ${score.controlsRemaining}**`);
  lines.push(`- Teams Ready / Blocked: **${score.teamsReady} / ${score.teamsBlocked}** (of ${score.requiredTeams})`);
  lines.push('');
  lines.push('## Required Team Readiness');
  lines.push('');
  lines.push('| Team | Readiness | Decision |');
  lines.push('|---|---|---|');
  for (const t of ctx.teams.filter((x) => x.required)) {
    lines.push(`| ${t.lens.title} | ${t.normalized}% | ${t.assessment.decision} |`);
  }
  lines.push('');
  return lines.join('\n');
}

export interface ArtifactDef {
  id: string;
  title: string;
  build: (ctx: ReportContext) => string;
}

export const EVIDENCE_ARTIFACTS: ArtifactDef[] = [
  { id: 'business-case', title: 'Business Case Summary', build: businessCaseSummary },
  { id: 'ai-intake', title: 'AI Intake Form', build: aiIntakeForm },
  { id: 'architecture', title: 'Architecture Review Summary', build: architectureReviewSummary },
  { id: 'sar', title: 'Security / SAR Evidence Pack', build: (c) => teamArtifact(c, 'security-sar', 'Security / SAR Evidence Pack') },
  { id: 'pia', title: 'Privacy / PIA Evidence Pack', build: (c) => teamArtifact(c, 'privacy-pia', 'Privacy / PIA Evidence Pack') },
  { id: 'legal', title: 'Legal Review Summary', build: (c) => teamArtifact(c, 'legal', 'Legal Review Summary') },
  { id: 'qrm', title: 'QRM / Risk Summary', build: (c) => teamArtifact(c, 'qrm-risk', 'QRM / Risk Summary') },
  { id: 'data-gov', title: 'Data Governance Summary', build: (c) => teamArtifact(c, 'data-governance', 'Data Governance Summary') },
  { id: 'iam', title: 'IAM Review Summary', build: (c) => teamArtifact(c, 'iam', 'IAM Review Summary') },
  { id: 'platform', title: 'Platform / Cloud Review Summary', build: (c) => teamArtifact(c, 'platform-cloud', 'Platform / Cloud Review Summary') },
  { id: 'sdlc', title: 'Secure SDLC Evidence Pack', build: (c) => teamArtifact(c, 'secure-sdlc', 'Secure SDLC Evidence Pack') },
  { id: 'ai-eng', title: 'AI Engineering Evidence Pack', build: (c) => teamArtifact(c, 'ai-engineering', 'AI Engineering Evidence Pack') },
  { id: 'agent-gov', title: 'Agent Governance Summary', build: (c) => teamArtifact(c, 'agent-governance', 'Agent Governance Summary') },
  { id: 'connector-gov', title: 'Connector Governance Summary', build: (c) => teamArtifact(c, 'connector-governance', 'Connector Governance Summary') },
  { id: 'support', title: 'Support Readiness Pack', build: (c) => teamArtifact(c, 'operations', 'Support Readiness Pack') },
  { id: 'adoption', title: 'Adoption and Training Plan', build: (c) => teamArtifact(c, 'adoption', 'Adoption and Training Plan') },
  { id: 'vendor', title: 'Vendor Risk Summary', build: (c) => teamArtifact(c, 'vendor-risk', 'Vendor Risk Summary') },
  { id: 'finance', title: 'Finance / FinOps Summary', build: (c) => teamArtifact(c, 'finance', 'Finance / FinOps Summary') },
  { id: 'go-no-go', title: 'Go / No-Go Decision Pack', build: toGoNoGoReport },
  { id: 'exec-dashboard', title: 'Executive Dashboard Report', build: executiveDashboardReport },
];

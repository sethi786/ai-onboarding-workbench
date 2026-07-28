import type { Profile, TeamId, WorkflowStage } from '../types';
import { LENS_BY_ID } from './teamLenses';
import { isRequired } from '../engine/reviewIntensity';

/**
 * The approval path.
 *
 * Most stages are the gate for one review team, so the stage exists only if
 * that team's review does. The rest are lifecycle milestones that happen
 * whoever reviewed what.
 */
interface StageDef {
  name: string;
  /** The review team whose gate this is, when there is one. */
  team?: TeamId;
}

const STAGE_DEFS: StageDef[] = [
  { name: 'Intake' },
  { name: 'Business Case', team: 'business' },
  { name: 'AI Program Review', team: 'ai-enablement' },
  { name: 'Enterprise Architecture', team: 'enterprise-architecture' },
  { name: 'Solution Architecture', team: 'solution-architecture' },
  { name: 'Security / SAR', team: 'security-sar' },
  { name: 'Privacy / PIA', team: 'privacy-pia' },
  { name: 'Legal / OGC', team: 'legal' },
  { name: 'QRM / Risk', team: 'qrm-risk' },
  { name: 'Data Governance', team: 'data-governance' },
  { name: 'IAM', team: 'iam' },
  { name: 'Platform / Cloud', team: 'platform-cloud' },
  { name: 'DevSecOps', team: 'secure-sdlc' },
  { name: 'AI Engineering', team: 'ai-engineering' },
  { name: 'Agent Governance', team: 'agent-governance' },
  { name: 'Connector Governance', team: 'connector-governance' },
  { name: 'Support Readiness', team: 'operations' },
  { name: 'Adoption / Training', team: 'adoption' },
  { name: 'Finance / FinOps', team: 'finance' },
  { name: 'Go / No-Go', team: 'go-no-go' },
  { name: 'Pilot' },
  { name: 'Production' },
  { name: 'Monitoring' },
  { name: 'Recertification' },
  { name: 'Retirement' },
];

export const WORKFLOW_STAGE_NAMES = STAGE_DEFS.map((s) => s.name);

/**
 * Seed the approval path for one tool.
 *
 * Pass the profile and the path contains only the gates that tool has to clear.
 * Without it, every adoption got all 25 stages — so the self-evaluation page
 * would tell somebody a review didn't apply while the workflow still asked them
 * to walk its gate. Two screens disagreeing about the same tool is worse than
 * either answer alone.
 *
 * The profile is optional because the stage list also renders as reference
 * content on the marketing site, where there is no tool to scope to.
 */
export function makeDefaultWorkflow(profile?: Profile): WorkflowStage[] {
  const inScope = STAGE_DEFS.filter((s) => {
    if (!s.team || !profile) return true;
    const lens = LENS_BY_ID[s.team];
    return lens ? isRequired(lens, profile) : true;
  });

  return inScope.map((s, i) => ({
    // Keyed by team (or a slug of the name) rather than by position, so a
    // stage's identity survives other stages being scoped in or out around it.
    id: s.team ?? s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    order: i + 1,
    name: s.name,
    status: 'Not Started',
    owner: '',
    dueDate: '',
    evidence: '',
    notes: '',
    blocker: '',
    decision: 'Not Reviewed',
  }));
}

/** Stage names skipped for this tool, so the UI can say why they're absent. */
export function skippedStageNames(profile: Profile): string[] {
  return STAGE_DEFS.filter(
    (s) => s.team && LENS_BY_ID[s.team] && !isRequired(LENS_BY_ID[s.team], profile),
  ).map((s) => s.name);
}

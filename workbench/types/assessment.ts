import type { TeamId } from './lens';

export type Decision =
  | 'Not Reviewed'
  | 'Approved'
  | 'Approved with Conditions'
  | 'Needs Remediation'
  | 'Blocked';

export interface EvidenceLink {
  id: string;
  label: string;
  url: string;
}

/**
 * The user's per-team self-assessment state, stored per profile.
 * Lazily created via makeEmptyAssessment — never pre-populated.
 */
export interface TeamAssessment {
  teamId: TeamId;
  score: number; // 0..5, -1 = not set
  checkedControls: Record<string, boolean>;
  checkedEvidence: Record<string, boolean>;
  activeBlockers: Record<string, boolean>;
  evidenceLinks: EvidenceLink[];
  markedLearned: boolean;
  needsRemediation: boolean;
  requiresFormalApproval: boolean;
  notes: string;
  owner: string;
  dueDate: string;
  residualRisk: string;
  decision: Decision;
  updatedAt: string;
}

export function makeEmptyAssessment(teamId: TeamId): TeamAssessment {
  return {
    teamId,
    score: -1,
    checkedControls: {},
    checkedEvidence: {},
    activeBlockers: {},
    evidenceLinks: [],
    markedLearned: false,
    needsRemediation: false,
    requiresFormalApproval: false,
    notes: '',
    owner: '',
    dueDate: '',
    residualRisk: '',
    decision: 'Not Reviewed',
    updatedAt: '',
  };
}

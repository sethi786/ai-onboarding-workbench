import type { RiskLevel, ApprovalStatus } from './profile';
import type { TeamId } from './lens';

export type Recommendation =
  | 'Proceed'
  | 'Proceed with Conditions'
  | 'Needs Remediation'
  | 'Blocked'
  | 'Not Ready for Review';

export interface TeamScore {
  teamId: TeamId;
  required: boolean;
  escalated: boolean;
  score: number; // 0..5, -1 if unset
  normalized: number; // 0..100
  controlsTotal: number;
  controlsComplete: number;
  evidenceTotal: number;
  evidenceComplete: number;
  activeBlockers: number;
  hasCriticalBlocker: boolean;
  completeness: number; // 0..1
}

export interface ScoreResult {
  readiness: number; // 0..100
  risk: RiskLevel;
  recommendation: Recommendation;
  approvalStatus: ApprovalStatus;
  evidenceCompleteness: number; // 0..100
  controlsComplete: number;
  controlsRemaining: number;
  blockersCount: number;
  hasCriticalBlocker: boolean;
  teamsReady: number;
  teamsBlocked: number;
  requiredTeams: number;
  perTeam: Record<string, TeamScore>;
}

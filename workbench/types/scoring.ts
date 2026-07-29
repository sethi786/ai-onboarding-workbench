import type { ReviewDepth } from './lens';
import type { RiskLevel, ApprovalStatus } from './profile';
import type { TeamId } from './lens';
import type { CertificationStatus } from '../engine/recertification';

export type Recommendation =
  | 'Proceed'
  | 'Proceed with Conditions'
  | 'Needs Remediation'
  | 'Blocked'
  | 'Not Ready for Review'
  /** Nobody has opened a single required review yet — distinct from failing one. */
  | 'Not Started'
  /** Some required reviews are outstanding, so nothing can be cleared yet. */
  | 'Review in Progress'
  /** Cleared once, but the clearance has run out. Not the same as failing. */
  | 'Recertification Due';

export interface TeamScore {
  teamId: TeamId;
  required: boolean;
  escalated: boolean;
  /** How hard this team looks at this tool — see workbench/engine/reviewIntensity. */
  depth: ReviewDepth;
  score: number; // 0..5, -1 if unset
  /**
   * Whether anyone has touched this review at all. A lens nobody has opened
   * must not read the same as one that was reviewed and scored zero.
   */
  started: boolean;
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
  /**
   * How ready the reviews that have actually been done are, 0..100.
   *
   * Averaged over *started* required lenses only, so it never conflates "we
   * haven't looked" with "we looked and it's bad". Always read it next to
   * `coverage` — a high readiness at 20% coverage is an early signal, not a
   * verdict, and `recommendation` refuses to clear anything until coverage
   * reaches 1.
   */
  readiness: number; // 0..100
  risk: RiskLevel;
  recommendation: Recommendation;
  approvalStatus: ApprovalStatus;
  evidenceCompleteness: number; // 0..100
  controlsComplete: number;
  controlsRemaining: number;
  blockersCount: number;
  hasCriticalBlocker: boolean;
  /** Required lenses signed off (Approved / Approved with Conditions, no critical blocker). */
  teamsSignedOff: number;
  teamsBlocked: number;
  /** Required lenses nobody has opened yet. */
  teamsNotStarted: number;
  requiredTeams: number;
  /** Required lenses started / required lenses, 0..1. */
  coverage: number;
  /** Whether the clearance is current, due, or expired. Null when not tracked. */
  certification: CertificationStatus | null;
  perTeam: Record<string, TeamScore>;
}

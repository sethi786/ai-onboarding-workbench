import type { Profile } from './profile';

export type TeamId =
  | 'business'
  | 'ai-enablement'
  | 'enterprise-architecture'
  | 'solution-architecture'
  | 'security-sar'
  | 'privacy-pia'
  | 'legal'
  | 'qrm-risk'
  | 'data-governance'
  | 'iam'
  | 'platform-cloud'
  | 'secure-sdlc'
  | 'ai-engineering'
  | 'agent-governance'
  | 'connector-governance'
  | 'operations'
  | 'adoption'
  | 'vendor-risk'
  | 'finance'
  | 'go-no-go';

export interface ControlItem {
  id: string;
  label: string;
  /** A critical control that, if flagged as a blocker, forces readiness to 0. */
  critical?: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
}

export interface EvidenceReq {
  id: string;
  label: string;
}

export interface BlockerDef {
  id: string;
  label: string;
  /** Critical blockers force readiness to 0 and status "Blocked". */
  critical?: boolean;
}

/**
 * Static control-pack content for one review team. This is never edited by the
 * user — it is the reference "lens" they self-assess against. All 20 lenses
 * live in src/data/teamLenses.ts and are rendered generically by TeamLensCard.
 */
export interface TeamLens {
  id: TeamId;
  title: string;
  short: string;
  order: number;
  icon: string;
  reviewPurpose: string;
  scope: string[];
  checklist: ChecklistItem[];
  requiredControls: ControlItem[];
  evidenceRequired: EvidenceReq[];
  passCriteria: string[];
  conditionalApproval: string[];
  blockers: BlockerDef[];
  commonFindings: string[];
  remediation: string[];
  reviewQuestions?: string[];
  /** Relative scoring weight (default 1). */
  weight: number;
  /** Whether this lens is always required, plus conditional escalation. */
  alwaysRequired: boolean;
  requiredWhen?: (p: Profile) => boolean;
  /**
   * Whether this lens applies to this kind of tool at all. A lens that does not
   * apply is never required — not even in Production, and not even when
   * `alwaysRequired` is set. Use this for scope (an AI Engineering review means
   * nothing for a third-party CRM); use `requiredWhen` for intensity.
   */
  appliesWhen?: (p: Profile) => boolean;
}

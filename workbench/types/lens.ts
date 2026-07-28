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
  /**
   * A make-or-break control. Two consequences: flagged as a blocker it forces
   * readiness to 0, and it is the one thing still asked at Screening depth —
   * the critical controls ARE the screening questionnaire.
   */
  critical?: boolean;
}

/**
 * How far a review goes, independent of whether it applies at all.
 *
 * Applicability answers "does this team care about this tool at all"; depth
 * answers "how hard do they look". A sandbox trial of a note-taking app and a
 * production rollout of a mailbox-reading assistant both warrant a security
 * review — they do not warrant the same security review. Without this
 * distinction the lowest-risk tool imaginable carries almost the full control
 * set, which is the process people bypass rather than follow.
 */
export type ReviewDepth = 'Screening' | 'Standard' | 'Deep';

export interface ChecklistItem {
  id: string;
  text: string;
}

export interface EvidenceReq {
  id: string;
  label: string;
  /**
   * Collected only at Deep depth. Reserve this for artifacts that cost real
   * money or weeks to produce — a pen test, a bias study, a DR rehearsal.
   * Demanding them on a low-risk pilot is how a control becomes theatre.
   */
  deep?: boolean;
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

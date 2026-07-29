import type {
  Profile,
  ProjectType,
  ToolCategory,
  DataClassification,
  Environment,
} from '@/workbench/types';
import type { TeamAssessment, TeamId, EvidenceLink } from '@/workbench/types';
import type { WorkflowStage } from '@/workbench/types';
import { makeEmptyAssessment } from '@/workbench/types';
import type {
  EvaluationRow,
  TeamAssessmentRow,
  EvidenceLinkRow,
  WorkflowStageRow,
} from './types';

/** DB evaluation row → domain Profile (the shape the engine consumes). */
export function rowToProfile(r: EvaluationRow): Profile {
  return {
    id: r.id,
    name: r.name,
    platform: r.platform,
    toolCategory: (r.tool_category ?? 'AI / ML system') as ToolCategory,
    toolType: r.tool_type as ProjectType,
    useCase: r.use_case,
    businessOwner: r.business_owner,
    technicalOwner: r.technical_owner,
    executiveSponsor: r.executive_sponsor,
    targetUsers: r.target_users,
    dataTypes: r.data_types ?? [],
    dataClassification: r.data_classification as DataClassification,
    environment: r.environment as Environment,
    model: r.model,
    agentEnabled: r.agent_enabled,
    connectorEnabled: r.connector_enabled,
    ragEnabled: r.rag_enabled,
    externalVendor: r.external_vendor,
    clientData: r.client_data,
    pii: r.pii,
    autonomousActions: r.autonomous_actions,
    selfHosted: r.self_hosted ?? false,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** Partial domain Profile → DB column patch (snake_case). */
export function profilePatchToRow(p: Partial<Profile>): Partial<EvaluationRow> {
  const out: Partial<EvaluationRow> = {};
  if (p.name !== undefined) out.name = p.name;
  if (p.platform !== undefined) out.platform = p.platform;
  if (p.toolCategory !== undefined) out.tool_category = p.toolCategory;
  if (p.toolType !== undefined) out.tool_type = p.toolType;
  if (p.useCase !== undefined) out.use_case = p.useCase;
  if (p.businessOwner !== undefined) out.business_owner = p.businessOwner;
  if (p.technicalOwner !== undefined) out.technical_owner = p.technicalOwner;
  if (p.executiveSponsor !== undefined) out.executive_sponsor = p.executiveSponsor;
  if (p.targetUsers !== undefined) out.target_users = p.targetUsers;
  if (p.dataTypes !== undefined) out.data_types = p.dataTypes;
  if (p.dataClassification !== undefined) out.data_classification = p.dataClassification;
  if (p.environment !== undefined) out.environment = p.environment;
  if (p.model !== undefined) out.model = p.model;
  if (p.agentEnabled !== undefined) out.agent_enabled = p.agentEnabled;
  if (p.connectorEnabled !== undefined) out.connector_enabled = p.connectorEnabled;
  if (p.ragEnabled !== undefined) out.rag_enabled = p.ragEnabled;
  if (p.externalVendor !== undefined) out.external_vendor = p.externalVendor;
  if (p.clientData !== undefined) out.client_data = p.clientData;
  if (p.pii !== undefined) out.pii = p.pii;
  if (p.autonomousActions !== undefined) out.autonomous_actions = p.autonomousActions;
  return out;
}

/** DB assessment row (+ its evidence links) → domain TeamAssessment. */
export function rowToTeamAssessment(
  r: TeamAssessmentRow,
  links: EvidenceLinkRow[],
): TeamAssessment {
  const evidenceLinks: EvidenceLink[] = links.map((l) => ({
    id: l.id,
    label: l.label,
    url: l.url,
  }));
  return {
    teamId: r.team_id as TeamId,
    score: r.score,
    checkedControls: r.checked_controls ?? {},
    checkedEvidence: r.checked_evidence ?? {},
    activeBlockers: r.active_blockers ?? {},
    evidenceLinks,
    markedLearned: r.marked_learned,
    needsRemediation: r.needs_remediation,
    requiresFormalApproval: r.requires_formal_approval,
    notes: r.notes,
    owner: r.owner,
    ownerUserId: r.owner_user_id ?? null,
    dueDate: r.due_date,
    residualRisk: r.residual_risk,
    decision: r.decision as TeamAssessment['decision'],
    updatedAt: r.updated_at,
  };
}

export function assessmentPatchToRow(p: Partial<TeamAssessment>): Partial<TeamAssessmentRow> {
  const out: Partial<TeamAssessmentRow> = {};
  if (p.score !== undefined) out.score = p.score;
  if (p.checkedControls !== undefined) out.checked_controls = p.checkedControls;
  if (p.checkedEvidence !== undefined) out.checked_evidence = p.checkedEvidence;
  if (p.activeBlockers !== undefined) out.active_blockers = p.activeBlockers;
  if (p.markedLearned !== undefined) out.marked_learned = p.markedLearned;
  if (p.needsRemediation !== undefined) out.needs_remediation = p.needsRemediation;
  if (p.requiresFormalApproval !== undefined) out.requires_formal_approval = p.requiresFormalApproval;
  if (p.notes !== undefined) out.notes = p.notes;
  if (p.owner !== undefined) out.owner = p.owner;
  if (p.ownerUserId !== undefined) out.owner_user_id = p.ownerUserId;
  if (p.dueDate !== undefined) out.due_date = p.dueDate;
  if (p.residualRisk !== undefined) out.residual_risk = p.residualRisk;
  if (p.decision !== undefined) out.decision = p.decision;
  return out;
}

export function rowToWorkflowStage(r: WorkflowStageRow): WorkflowStage {
  return {
    id: r.stage_key,
    order: r.ordinal,
    name: r.name,
    status: r.status as WorkflowStage['status'],
    owner: r.owner,
    dueDate: r.due_date,
    evidence: r.evidence,
    notes: r.notes,
    blocker: r.blocker,
    decision: r.decision as WorkflowStage['decision'],
  };
}

export { makeEmptyAssessment };

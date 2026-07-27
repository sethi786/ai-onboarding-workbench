export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type DataClassification = 'Public' | 'Internal' | 'Confidential' | 'Restricted';

export type Environment = 'Sandbox' | 'Pilot' | 'UAT' | 'Production';

export type ProfileStatus =
  | 'Draft'
  | 'In Review'
  | 'Conditionally Approved'
  | 'Approved'
  | 'Rejected';

export type ApprovalStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Approved'
  | 'Approved with Conditions'
  | 'Blocked';

export type ProjectType =
  | 'Enterprise SaaS AI platform'
  | 'Internal AI application'
  | 'RAG assistant'
  | 'Coding agent'
  | 'Workspace agent'
  | 'Copilot Studio agent'
  | 'Connector enablement'
  | 'Model picker / new model enablement'
  | 'AI Lab sandbox'
  | 'Third-party AI tool'
  | 'Client-facing AI app'
  | 'Internal productivity assistant'
  | 'Agentic workflow automation'
  | 'Secure developer sandbox'
  | 'Knowledge search platform';

/**
 * A Profile represents one AI tool / platform / agent being self-evaluated.
 * Capability flags (agent/connector/rag/pii/...) drive conditional review
 * intensity in src/engine/reviewIntensity.ts.
 */
export interface Profile {
  id: string;
  name: string;
  platform: string;
  toolType: ProjectType;
  useCase: string;

  businessOwner: string;
  technicalOwner: string;
  executiveSponsor: string;
  targetUsers: string;

  dataTypes: string[];
  dataClassification: DataClassification;
  environment: Environment;
  model: string;

  /* Capability flags */
  agentEnabled: boolean;
  connectorEnabled: boolean;
  ragEnabled: boolean;
  externalVendor: boolean;
  clientData: boolean;
  pii: boolean;
  autonomousActions: boolean;

  createdAt: string;
  updatedAt: string;
}

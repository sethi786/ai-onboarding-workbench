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

/**
 * Top-level delivery model. This is the primary scoping decision — it
 * determines which review lenses are even applicable before any capability
 * flag is considered.
 */
export type ToolCategory =
  | 'SaaS application'
  | 'PaaS / cloud service'
  | 'On-premise software'
  | 'AI / ML system'
  | 'Internal build';

export const TOOL_CATEGORIES: ToolCategory[] = [
  'SaaS application',
  'PaaS / cloud service',
  'On-premise software',
  'AI / ML system',
  'Internal build',
];

export type ProjectType =
  // AI / ML
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
  | 'Knowledge search platform'
  // SaaS / business applications
  | 'Business SaaS application'
  | 'CRM / sales platform'
  | 'HR / people platform'
  | 'Finance / ERP system'
  | 'Collaboration & messaging'
  | 'Marketing / analytics platform'
  | 'Developer tool / service'
  // PaaS / infrastructure
  | 'Cloud platform service'
  | 'Data platform / warehouse'
  | 'Identity / security service'
  | 'Integration / middleware'
  // On-premise
  | 'Self-hosted application'
  | 'Infrastructure / appliance'
  | 'Database / storage system';

/** Project types offered for each category, in the order shown to users. */
export const PROJECT_TYPES_BY_CATEGORY: Record<ToolCategory, ProjectType[]> = {
  'SaaS application': [
    'Business SaaS application',
    'CRM / sales platform',
    'HR / people platform',
    'Finance / ERP system',
    'Collaboration & messaging',
    'Marketing / analytics platform',
    'Developer tool / service',
    'Third-party AI tool',
  ],
  'PaaS / cloud service': [
    'Cloud platform service',
    'Data platform / warehouse',
    'Identity / security service',
    'Integration / middleware',
    'Developer tool / service',
  ],
  'On-premise software': [
    'Self-hosted application',
    'Infrastructure / appliance',
    'Database / storage system',
    'Secure developer sandbox',
  ],
  'AI / ML system': [
    'Enterprise SaaS AI platform',
    'Internal AI application',
    'RAG assistant',
    'Coding agent',
    'Workspace agent',
    'Copilot Studio agent',
    'Agentic workflow automation',
    'Knowledge search platform',
    'Client-facing AI app',
    'Internal productivity assistant',
    'Model picker / new model enablement',
    'Connector enablement',
    'AI Lab sandbox',
  ],
  'Internal build': [
    'Internal AI application',
    'Self-hosted application',
    'Developer tool / service',
    'Client-facing AI app',
  ],
};

/**
 * A Profile represents one tool being evaluated for adoption — a SaaS
 * application, cloud service, on-premise system, or AI/ML tool.
 *
 * `toolCategory` scopes which lenses apply at all; the capability flags
 * (agent/connector/rag/pii/...) then drive conditional review intensity in
 * engine/reviewIntensity.ts.
 */
export interface Profile {
  id: string;
  name: string;
  platform: string;
  toolCategory: ToolCategory;
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
  /** You run it yourself — you own hardening, patching, and supply chain. */
  selfHosted: boolean;

  createdAt: string;
  updatedAt: string;
}

/**
 * True when a profile involves AI/ML capability — either by category or
 * because an AI-specific capability is switched on. AI-only lenses key off
 * this rather than the category alone, so a SaaS app with an embedded
 * assistant is still reviewed as AI.
 */
export function isAiTool(p: Pick<Profile, 'toolCategory' | 'agentEnabled' | 'ragEnabled' | 'autonomousActions'>): boolean {
  return (
    p.toolCategory === 'AI / ML system' || p.agentEnabled || p.ragEnabled || p.autonomousActions
  );
}

/**
 * True when your organization is responsible for the build or the runtime —
 * which is what makes secure-SDLC and hardening review meaningful. A pure
 * third-party SaaS purchase does not qualify.
 */
export function isSelfBuiltOrHosted(
  p: Pick<Profile, 'toolCategory' | 'selfHosted'>,
): boolean {
  return (
    p.selfHosted ||
    p.toolCategory === 'On-premise software' ||
    p.toolCategory === 'Internal build'
  );
}

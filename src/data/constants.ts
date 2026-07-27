import type {
  DataClassification,
  Environment,
  ProjectType,
} from '../types';

export const APP_NAME = 'AI Onboarding Self-Evaluation Workbench';

export const DISCLAIMER =
  'This tool is a self-evaluation and learning aid. It helps prepare review evidence and understand ' +
  'what each review area may examine. It does not replace official enterprise approval workflows. ' +
  'Final decisions must follow the organization’s formal architecture, security, privacy, legal, ' +
  'QRM/risk, data governance, platform, support, finance, change management, and go/no-go approval processes.';

export const DRAFT_BANNER = 'Draft only. Requires official review. Does not replace formal approval.';

export const PLATFORMS = [
  'Microsoft 365 Copilot',
  'Copilot Studio',
  'ChatGPT Enterprise',
  'Gemini Enterprise',
  'Claude Enterprise',
  'Azure AI Foundry',
  'Google Vertex AI',
  'AWS Bedrock',
  'Codex',
  'Replit',
  'Internal AI App',
];

export const PROJECT_TYPES: ProjectType[] = [
  'Enterprise SaaS AI platform',
  'Internal AI application',
  'RAG assistant',
  'Coding agent',
  'Workspace agent',
  'Copilot Studio agent',
  'Connector enablement',
  'Model picker / new model enablement',
  'AI Lab sandbox',
  'Third-party AI tool',
  'Client-facing AI app',
  'Internal productivity assistant',
  'Agentic workflow automation',
  'Secure developer sandbox',
  'Knowledge search platform',
];

export const DATA_CLASSIFICATIONS: DataClassification[] = [
  'Public',
  'Internal',
  'Confidential',
  'Restricted',
];

export const ENVIRONMENTS: Environment[] = ['Sandbox', 'Pilot', 'UAT', 'Production'];

export const DATA_TYPE_OPTIONS = [
  'None / Public',
  'Internal Documents',
  'HR Data',
  'Financial Data',
  'Client Data',
  'Source Code',
  'Legal / Contracts',
  'Health Data',
  'Personal Data (PII)',
  'Credentials / Secrets',
];

export const SCORE_LABELS: Record<number, string> = {
  0: 'Not Ready',
  1: 'Major Gaps',
  2: 'Learning / Weak Evidence',
  3: 'Partial Readiness',
  4: 'Ready for Review',
  5: 'Strong / Ready to Explain',
};

export const DECISION_OPTIONS = [
  'Not Reviewed',
  'Approved',
  'Approved with Conditions',
  'Needs Remediation',
  'Blocked',
] as const;

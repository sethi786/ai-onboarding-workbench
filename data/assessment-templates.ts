import type { ToolTemplate } from './tool-templates';

const scenarios: {
  id: string;
  name: string;
  summary: string;
  defaults: ToolTemplate['defaults'];
  focus: string;
}[] = [
  {
    id: 'assistant-rollout',
    name: 'Employee AI assistant rollout',
    summary:
      'Review a writing, research, or productivity assistant before staff adoption.',
    defaults: {
      toolType: 'Internal productivity assistant',
      externalVendor: true,
      pii: true,
    },
    focus:
      'Permitted content, vendor retention, staff training, account controls, and use restrictions.',
  },
  {
    id: 'coding-agent',
    name: 'Coding agent & developer tools',
    summary:
      'Review repository access, generated changes, and development environments.',
    defaults: {
      toolType: 'Coding agent',
      agentEnabled: true,
      connectorEnabled: true,
      autonomousActions: true,
      externalVendor: true,
    },
    focus:
      'Repository scopes, secrets, code review, dependency risk, sandbox isolation, and merge approval.',
  },
  {
    id: 'knowledge-rag',
    name: 'Internal knowledge & RAG',
    summary: 'Review search and generation over internal documents.',
    defaults: {
      toolType: 'RAG assistant',
      ragEnabled: true,
      connectorEnabled: true,
      pii: true,
    },
    focus:
      'Source permissions, data provenance, permission trimming, injection tests, and deletion propagation.',
  },
  {
    id: 'customer-support',
    name: 'Customer-facing AI',
    summary:
      'Review an assistant that answers customers or handles their information.',
    defaults: {
      toolType: 'Client-facing AI app',
      clientData: true,
      pii: true,
      externalVendor: true,
      ragEnabled: true,
    },
    focus:
      'Customer notice, answer quality, harmful output tests, escalation, and protected information.',
  },
  {
    id: 'autonomous-workflow',
    name: 'Autonomous workflow',
    summary:
      'Review an agent with access to tools and permission to take actions.',
    defaults: {
      toolType: 'Agentic workflow automation',
      agentEnabled: true,
      connectorEnabled: true,
      autonomousActions: true,
      pii: true,
    },
    focus:
      'Action allowlists, financial and data limits, human approval, audit logs, rollback, and emergency stop.',
  },
  {
    id: 'meeting-assistant',
    name: 'Meeting recording & transcription',
    summary: 'Review recording, transcription, summaries, and meeting data.',
    defaults: {
      toolType: 'Internal productivity assistant',
      externalVendor: true,
      pii: true,
    },
    focus:
      'Participant consent, recording notice, sensitive meetings, transcript access, and deletion schedules.',
  },
];
export const ASSESSMENT_TEMPLATES: ToolTemplate[] = scenarios.map((s, i) => ({
  id: `assessment-${s.id}`,
  name: s.name,
  vendor: 'Aegis assessment starter',
  platform: '',
  category: 'Assessment',
  toolType: s.defaults.toolType!,
  summary: s.summary,
  sortOrder: i,
  defaults: {
    toolCategory: 'AI / ML system',
    environment: 'Sandbox',
    dataClassification: 'Confidential',
    useCase: `Draft scope: ${s.focus}`,
    ...s.defaults,
  },
  suggested: {
    business: {
      notes: `Confirm your use case, responsible owner, permitted users, and success measures. ${s.focus}`,
    },
    'security-sar': {
      notes: `Assessment focus: ${s.focus} Record evidence before marking controls complete.`,
    },
    'privacy-pia': {
      notes:
        'Document data categories, processing purpose, recipients, retention, and deletion. Confirm your actual scope.',
    },
  },
}));

import type { WorkflowStage } from '../types';

export const WORKFLOW_STAGE_NAMES = [
  'Intake',
  'Business Case',
  'AI Program Review',
  'Enterprise Architecture',
  'Solution Architecture',
  'Security / SAR',
  'Privacy / PIA',
  'Legal / OGC',
  'QRM / Risk',
  'Data Governance',
  'IAM',
  'Platform / Cloud',
  'DevSecOps',
  'AI Engineering',
  'Agent Governance',
  'Connector Governance',
  'Support Readiness',
  'Adoption / Training',
  'Finance / FinOps',
  'Go / No-Go',
  'Pilot',
  'Production',
  'Monitoring',
  'Recertification',
  'Retirement',
];

export function makeDefaultWorkflow(): WorkflowStage[] {
  return WORKFLOW_STAGE_NAMES.map((name, i) => ({
    id: `stage-${i + 1}`,
    order: i + 1,
    name,
    status: 'Not Started',
    owner: '',
    dueDate: '',
    evidence: '',
    notes: '',
    blocker: '',
    decision: 'Not Reviewed',
  }));
}

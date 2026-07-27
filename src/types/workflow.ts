import type { Decision } from './assessment';

export type StageStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Complete'
  | 'Blocked'
  | 'Skipped';

export interface WorkflowStage {
  id: string;
  order: number;
  name: string;
  status: StageStatus;
  owner: string;
  dueDate: string;
  evidence: string;
  notes: string;
  blocker: string;
  decision: Decision;
}

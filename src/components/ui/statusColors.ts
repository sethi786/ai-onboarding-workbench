import type { RiskLevel, ApprovalStatus, Recommendation } from '../../types';

export type BadgeTone = 'green' | 'yellow' | 'orange' | 'red' | 'gray' | 'blue' | 'purple';

export function riskTone(risk: RiskLevel): BadgeTone {
  switch (risk) {
    case 'Low':
      return 'green';
    case 'Medium':
      return 'yellow';
    case 'High':
      return 'orange';
    case 'Critical':
      return 'red';
  }
}

export function approvalTone(status: ApprovalStatus): BadgeTone {
  switch (status) {
    case 'Approved':
      return 'green';
    case 'Approved with Conditions':
      return 'yellow';
    case 'In Progress':
      return 'blue';
    case 'Blocked':
      return 'red';
    case 'Not Started':
      return 'gray';
  }
}

export function recommendationTone(rec: Recommendation): BadgeTone {
  switch (rec) {
    case 'Proceed':
      return 'green';
    case 'Proceed with Conditions':
      return 'yellow';
    case 'Needs Remediation':
      return 'orange';
    case 'Blocked':
      return 'red';
    case 'Not Ready for Review':
      return 'gray';
  }
}

export function decisionTone(decision: string): BadgeTone {
  switch (decision) {
    case 'Approved':
      return 'green';
    case 'Approved with Conditions':
      return 'yellow';
    case 'Needs Remediation':
      return 'orange';
    case 'Blocked':
      return 'red';
    default:
      return 'gray';
  }
}

export function stageTone(status: string): BadgeTone {
  switch (status) {
    case 'Complete':
      return 'green';
    case 'In Progress':
      return 'blue';
    case 'Blocked':
      return 'red';
    case 'Skipped':
      return 'gray';
    default:
      return 'gray';
  }
}

export function readinessTone(value: number): BadgeTone {
  if (value >= 85) return 'green';
  if (value >= 70) return 'yellow';
  if (value >= 50) return 'orange';
  return 'red';
}

export function progressClass(value: number): string {
  if (value >= 85) return 'progress__bar--green';
  if (value >= 70) return 'progress__bar--yellow';
  if (value >= 50) return 'progress__bar--orange';
  return 'progress__bar--red';
}

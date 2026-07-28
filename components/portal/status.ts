import type { RiskLevel, Recommendation, ScoreResult } from '@/workbench/types';

type Tone = 'neutral' | 'electric' | 'trust' | 'success' | 'warning' | 'danger' | 'outline';

export function riskTone(risk: RiskLevel): Tone {
  return risk === 'Low' ? 'success' : risk === 'Medium' ? 'warning' : risk === 'High' ? 'warning' : 'danger';
}

export function recommendationTone(rec: Recommendation): Tone {
  switch (rec) {
    case 'Proceed':
      return 'success';
    case 'Proceed with Conditions':
      return 'warning';
    case 'Needs Remediation':
      return 'warning';
    case 'Blocked':
      return 'danger';
    default:
      return 'neutral';
  }
}

/** Same bands as ScoreGauge — see the note there on why they moved down. */
export function readinessTone(v: number): Tone {
  return v >= 80 ? 'success' : v >= 35 ? 'warning' : 'danger';
}

export function decisionTone(decision: string): Tone {
  switch (decision) {
    case 'Approved':
      return 'success';
    case 'Approved with Conditions':
      return 'warning';
    case 'Needs Remediation':
      return 'warning';
    case 'Blocked':
      return 'danger';
    default:
      return 'neutral';
  }
}

export type { ScoreResult };

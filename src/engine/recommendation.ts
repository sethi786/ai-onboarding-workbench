import type { RiskLevel, ApprovalStatus, Recommendation } from '../types';

const RISK_ORDER: Record<RiskLevel, number> = {
  Low: 0,
  Medium: 1,
  High: 2,
  Critical: 3,
};

/**
 * Final go/no-go recommendation from readiness + risk + blocker state.
 *  - Critical blocker         -> Blocked
 *  - readiness >= 85 & risk<=Medium -> Proceed
 *  - readiness >= 70          -> Proceed with Conditions
 *  - readiness >= 50          -> Needs Remediation
 *  - otherwise                -> Not Ready for Review
 */
export function computeRecommendation(
  readiness: number,
  risk: RiskLevel,
  hasCriticalBlocker: boolean,
): Recommendation {
  if (hasCriticalBlocker) return 'Blocked';
  if (readiness >= 85 && RISK_ORDER[risk] <= RISK_ORDER.Medium) return 'Proceed';
  if (readiness >= 70) return 'Proceed with Conditions';
  if (readiness >= 50) return 'Needs Remediation';
  return 'Not Ready for Review';
}

export function recommendationToApproval(rec: Recommendation): ApprovalStatus {
  switch (rec) {
    case 'Proceed':
      return 'Approved';
    case 'Proceed with Conditions':
      return 'Approved with Conditions';
    case 'Blocked':
      return 'Blocked';
    case 'Needs Remediation':
    case 'Not Ready for Review':
      return 'In Progress';
  }
}

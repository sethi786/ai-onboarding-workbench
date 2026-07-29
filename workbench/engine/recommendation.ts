import type { RiskLevel, ApprovalStatus, Recommendation } from '../types';

const RISK_ORDER: Record<RiskLevel, number> = {
  Low: 0,
  Medium: 1,
  High: 2,
  Critical: 3,
};

/**
 * Final go/no-go recommendation from readiness + risk + blocker state.
 *
 * `coverage` (0..1) is the share of required reviews anyone has started, and it
 * is what stops the number from lying in the two directions it otherwise would.
 * Nothing gets cleared on a partial review, however well the finished parts
 * scored — a security review nobody opened is not an implicit pass. Bad news,
 * though, travels immediately: a blocker or a poor result found in the first
 * lens reviewed is reported as it stands, because that is exactly when the
 * team can still act on it.
 *
 *  - no required review started -> Not Started
 *  - critical blocker           -> Blocked
 *  - readiness >= 85 & risk<=Medium -> Proceed
 *  - readiness >= 70            -> Proceed with Conditions
 *  - readiness >= 50            -> Needs Remediation
 *  - otherwise                  -> Not Ready for Review
 *  …but a positive call with coverage < 1 downgrades to Review in Progress.
 */
export function computeRecommendation(
  readiness: number,
  risk: RiskLevel,
  hasCriticalBlocker: boolean,
  coverage = 1,
): Recommendation {
  if (coverage <= 0) return 'Not Started';
  if (hasCriticalBlocker) return 'Blocked';

  const call: Recommendation =
    readiness >= 85 && RISK_ORDER[risk] <= RISK_ORDER.Medium
      ? 'Proceed'
      : readiness >= 70
        ? 'Proceed with Conditions'
        : readiness >= 50
          ? 'Needs Remediation'
          : 'Not Ready for Review';

  if (coverage < 1 && (call === 'Proceed' || call === 'Proceed with Conditions')) {
    return 'Review in Progress';
  }
  return call;
}

export function recommendationToApproval(rec: Recommendation): ApprovalStatus {
  switch (rec) {
    case 'Proceed':
      return 'Approved';
    case 'Proceed with Conditions':
      return 'Approved with Conditions';
    case 'Blocked':
      return 'Blocked';
    case 'Not Started':
      return 'Not Started';
    // Expired clearance is not an approval. It is also not a rejection — the
    // review passed, it simply stopped being current.
    case 'Recertification Due':
      return 'In Progress';
    case 'Needs Remediation':
    case 'Not Ready for Review':
    case 'Review in Progress':
      return 'In Progress';
  }
}

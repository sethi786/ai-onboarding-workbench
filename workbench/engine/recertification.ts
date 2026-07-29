import type { RiskLevel } from '../types';

/**
 * When a clearance stops being true.
 *
 * A review is a statement about a tool at a moment: these controls were in
 * place, this data was in scope, this vendor had these terms. Tools change.
 * Copilot gains a connector, a vendor adds a subprocessor, a pilot becomes a
 * company-wide rollout — and an approval signed eighteen months ago goes on
 * reading exactly like one signed yesterday.
 *
 * Aegis already requires its own customers to set a recertification cadence:
 * `ag-ctl-8` ("a recertification date is set at which the agent's permissions
 * and continued existence are re-approved") and `cn-ctl-8` say so directly.
 * Not doing it here was the product failing the control it sells.
 *
 * Deliberately separate from scoring. Readiness answers "how good is this
 * review"; certification answers "is that answer still current". Conflating
 * them would mean a stale review scoring badly, which is wrong — it scored
 * fine, it just expired.
 */

export type CertificationState =
  /** Never signed off, so nothing to expire. */
  | 'not-certified'
  /** Signed off and still inside its validity period. */
  | 'current'
  /** Inside the window where somebody should be starting the re-review. */
  | 'due-soon'
  /** Past its date. The tool is no longer cleared. */
  | 'expired';

/** How long a clearance lasts, by the risk it was cleared at. */
export const CADENCE_MONTHS: Record<RiskLevel, number> = {
  // A critical-risk tool that was cleared at all was cleared on conditions;
  // those conditions deserve checking within the quarter.
  Critical: 3,
  High: 6,
  Medium: 12,
  Low: 24,
};

/** Days before expiry that a review starts asking to be renewed. */
export const DUE_SOON_DAYS = 30;

const DAY_MS = 86_400_000;

/** Parse a yyyy-mm-dd or ISO timestamp to a UTC day boundary. */
function toDay(value: string): number | null {
  const t = Date.parse(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(t) ? null : Math.floor(t / DAY_MS);
}

export interface Certification {
  /** yyyy-mm-dd the current clearance runs out, or null if never certified. */
  validUntil: string | null;
  /** yyyy-mm-dd treated as today. Passed in so this stays pure and testable. */
  today: string;
}

export interface CertificationStatus {
  state: CertificationState;
  /** Negative once expired. Null when never certified. */
  daysRemaining: number | null;
}

export function certificationStatus(cert: Certification): CertificationStatus {
  if (!cert.validUntil) return { state: 'not-certified', daysRemaining: null };
  const until = toDay(cert.validUntil);
  const now = toDay(cert.today);
  if (until === null || now === null) return { state: 'not-certified', daysRemaining: null };

  const daysRemaining = until - now;
  if (daysRemaining < 0) return { state: 'expired', daysRemaining };
  if (daysRemaining <= DUE_SOON_DAYS) return { state: 'due-soon', daysRemaining };
  return { state: 'current', daysRemaining };
}

/**
 * The date a clearance granted today would run out.
 *
 * Month arithmetic clamps rather than rolling over: certifying on 31 January
 * with a 1-month cadence expires on 28 February, not 3 March. A date that
 * silently jumps a month is the kind of detail that loses an argument with an
 * auditor.
 */
export function nextValidUntil(from: string, risk: RiskLevel): string {
  const base = new Date(from.length === 10 ? `${from}T00:00:00Z` : from);
  if (Number.isNaN(base.getTime())) return '';
  const months = CADENCE_MONTHS[risk];

  const y = base.getUTCFullYear();
  const m = base.getUTCMonth() + months;
  const d = base.getUTCDate();
  const lastDayOfTarget = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const target = new Date(Date.UTC(y, m, Math.min(d, lastDayOfTarget)));
  return target.toISOString().slice(0, 10);
}

/** One line for a reviewer, an approval pack, or a dashboard row. */
export function certificationSummary(
  status: CertificationStatus,
  validUntil: string | null,
): string {
  switch (status.state) {
    case 'not-certified':
      return 'Not yet certified. A clearance date is set when the go/no-go decision is recorded.';
    case 'current':
      return `Cleared until ${validUntil} — ${status.daysRemaining} days remaining.`;
    case 'due-soon':
      return `Recertification due in ${status.daysRemaining} day${status.daysRemaining === 1 ? '' : 's'} (${validUntil}). Start the re-review now.`;
    case 'expired':
      return `Clearance expired on ${validUntil}, ${Math.abs(status.daysRemaining ?? 0)} days ago. This tool is no longer cleared.`;
  }
}

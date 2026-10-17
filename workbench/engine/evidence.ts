import type { Profile, TeamAssessment } from '../types';

/** Link syntax only: this does not assert that the document exists or is verified. */
export function isSafeEvidenceUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function isCurrentAssessment(a: TeamAssessment, profile: Profile): boolean {
  return a.scopeRevision === (profile.scopeRevision ?? 1);
}

export function isEvidenceComplete(a: TeamAssessment, evidenceId: string, profile: Profile, asOf: string): boolean {
  if (!isCurrentAssessment(a, profile) || a.checkedEvidence[evidenceId] !== true) return false;
  return a.evidenceLinks.some((link) =>
    link.evidenceId === evidenceId &&
    link.scopeRevision === (profile.scopeRevision ?? 1) &&
    isSafeEvidenceUrl(link.url) &&
    (!link.expiresOn || (/^\d{4}-\d{2}-\d{2}$/.test(link.expiresOn) && link.expiresOn >= asOf.slice(0, 10))),
  );
}

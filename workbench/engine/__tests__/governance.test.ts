import { describe, expect, it } from 'vitest';
import { baseProfile, allFull } from './fixtures';
import { TEAM_LENSES, LENS_BY_ID } from '../../data/teamLenses';
import { computeScoreFromMap, computeRisk } from '../scoring';
import { isEvidenceComplete, isSafeEvidenceUrl } from '../evidence';
import { buildReportContext } from '../../export/reportContext';
import { toGoNoGoReport } from '../../export/toGoNoGoReport';
import { toCsv } from '../../export/toCsv';
import { toMarkdownReport } from '../../export/toMarkdownReport';
import { toRemediationPlan } from '../../export/toRemediationPlan';

const now = '2026-10-17T12:00:00.000Z';
const profile = baseProfile({ dataClassification: 'Public' });
const score = (map = allFull()) => computeScoreFromMap(profile, TEAM_LENSES, map, now);

describe('governance integrity', () => {
  it('never converts readiness into a recorded approval', () => {
    const r = score();
    expect(r.readiness).toBe(100);
    expect(r.recommendation).toBe('Proceed');
    expect(r.approvalStatus).toBe('In Progress');
  });
  it('requires all required explicit decisions before reporting self-approval', () => {
    const map = allFull();
    Object.values(map).forEach((a) => { a.decision = 'Approved'; });
    expect(score(map).approvalStatus).toBe('Approved');
    map['security-sar'].decision = 'Not Reviewed';
    expect(score(map).approvalStatus).toBe('In Progress');
    map['security-sar'].decision = 'Approved with Conditions';
    expect(score(map).approvalStatus).toBe('Approved with Conditions');
  });
  it('keeps missing required reviews in the denominator', () => {
    const map = allFull();
    delete map['security-sar'];
    expect(score(map).readiness).toBeLessThan(100);
    expect(score(map).requiredTeams).toBe(score().requiredTeams);
    expect(score(map).recommendation).toBe('Needs Remediation');
  });
  it('ignores out-of-scope and unknown blockers', () => {
    const map = allFull();
    map['agent-governance'].decision = 'Blocked';
    map['security-sar'].activeBlockers['invented'] = true;
    expect(score(map).hasCriticalBlocker).toBe(false);
    expect(score(map).blockersCount).toBe(0);
    expect(score(map).recommendation).toBe('Proceed');
  });
  it.each([NaN, Infinity, -Infinity, -5, 6, 1.5])('fails closed for invalid score %s', (value) => {
    const map = allFull(); map['security-sar'].score = value;
    const r = score(map);
    expect(r.perTeam['security-sar'].normalized).toBe(0);
    expect(r.readiness).toBeGreaterThanOrEqual(0);
    expect(r.readiness).toBeLessThanOrEqual(100);
    expect(r.recommendation).not.toBe('Proceed');
  });
  it('does not award evidence credit for checkboxes alone or generic links', () => {
    const map = allFull();
    map['security-sar'].evidenceLinks = [{ id: 'generic', label: 'Policy', url: 'https://example.com', scopeRevision: 1 }];
    expect(score(map).perTeam['security-sar'].evidenceComplete).toBe(0);
    expect(score(map).recommendation).toBe('Needs Remediation');
  });
  it('rejects expired, wrong-item, unsafe, and earlier-scope evidence', () => {
    const a = allFull()['security-sar']; const id = LENS_BY_ID['security-sar'].evidenceRequired[0].id;
    const valid = { ...a.evidenceLinks[0] };
    for (const override of [{ expiresOn: '2026-10-16' }, { evidenceId: 'wrong' }, { scopeRevision: 0 }, { url: 'javascript:alert(1)' }]) {
      a.evidenceLinks = [{ ...valid, ...override }];
      expect(isEvidenceComplete(a, id, profile, now)).toBe(false);
    }
    a.evidenceLinks = [{ ...valid, expiresOn: '2026-10-17' }];
    expect(isEvidenceComplete(a, id, profile, now)).toBe(true);
  });
  it('invalidates previous scope without erasing saved notes or links', () => {
    const map = allFull(); map['security-sar'].notes = 'Keep this review history';
    const r = computeScoreFromMap({ ...profile, scopeRevision: 2 }, TEAM_LENSES, map, now);
    expect(r.readiness).toBe(0); expect(r.evidenceCompleteness).toBe(0);
    expect(map['security-sar'].notes).toBe('Keep this review history');
    expect(map['security-sar'].evidenceLinks.length).toBeGreaterThan(0);
  });
  it('requires remediation even when every checklist and self-score is full', () => {
    const map = allFull(); map['security-sar'].needsRemediation = true;
    expect(score(map).readiness).toBe(100);
    expect(score(map).recommendation).toBe('Needs Remediation');
  });
  it('includes explicit blocked decisions in remediation exports even without catalogue blockers', () => {
    const map = allFull(); map['security-sar'].decision = 'Blocked';
    const ctx = buildReportContext(profile, score(map), (id) => map[id], now);
    expect(toRemediationPlan(ctx)).toContain('Resolve open blockers.');
    expect(toMarkdownReport(ctx)).not.toContain('No open remediation items.');
  });
  it('keeps autonomy at High and sensitive autonomy at Critical', () => {
    expect(computeRisk({ ...profile, autonomousActions: true }, false)).toBe('High');
    expect(computeRisk({ ...profile, autonomousActions: true, pii: true }, false)).toBe('Critical');
  });
  it.each(['javascript:alert(1)', 'data:text/html,test', '//host/path', 'https://user:secret@example.com', 'not a URL'])('rejects unsafe reference %s', (url) => expect(isSafeEvidenceUrl(url)).toBe(false));
  it('keeps reports, next actions and evidence counts consistent', () => {
    const map = allFull(); map['security-sar'].evidenceLinks = [];
    const result = score(map);
    const ctx = buildReportContext(profile, result, (id) => map[id], now);
    expect(ctx.teams.find((t) => t.lens.id === 'security-sar')?.missingEvidence.length).toBe(LENS_BY_ID['security-sar'].evidenceRequired.length);
    for (const report of [toGoNoGoReport(ctx), toMarkdownReport(ctx)]) {
      expect(report).toContain(result.methodologyVersion); expect(report).toContain('Needs Remediation');
      expect(report).toContain('Attach current evidence');
    }
    expect(toCsv({ ...ctx, profile: { ...profile, name: '=HYPERLINK("https://example.com")' } })).toContain("'=HYPERLINK");
  });
});

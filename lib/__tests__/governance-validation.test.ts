import { describe, expect, it } from 'vitest';
import { validateAssessmentPatch, validateProfilePatch, validateWorkflowPatch, validDate } from '../validation/governance';
import { profilePatchToRow } from '../db/mappers';

describe('server action payload validation', () => {
  it.each([null, [], {}, { org_id: 'other' }, { teamId: 'business' }, { scopeRevision: 9 }, { evidenceLinks: [] }, { score: 99 }, { score: NaN }, { score: 2.5 }, { score: '5' }, { decision: 'Certified' }, { checkedControls: { invented: true } }, { checkedControls: { 'sar-ctl-1': 'true' } }])('rejects malformed or privileged assessment payload %j', (payload) => {
    expect(validateAssessmentPatch('security-sar', payload)).not.toBeNull();
  });
  it('accepts valid complete and partial fields', () => {
    expect(validateAssessmentPatch('security-sar', { score: 5, notes: 'Reviewed', decision: 'Not Reviewed', checkedControls: { 'sar-ctl-1': true } })).toBeNull();
    expect(validateWorkflowPatch({ status: 'Complete', notes: 'Reviewed' })).toBeNull();
  });
  it('rejects unknown teams including prototype keys', () => {
    expect(validateAssessmentPatch('toString', { score: 3 })).not.toBeNull();
  });
  it.each([{ id: 'changed' }, { createdAt: 'changed' }, { scopeRevision: 2 }, { environment: 'Moon' }, { autonomousActions: 'false' }, { name: '  ' }])('protects profile fields %j', (value) => {
    expect(validateProfilePatch(value)).not.toBeNull();
  });
  it('validates real dates', () => {
    expect(validDate('2026-02-30')).toBe(false);
    expect(validDate('2024-02-29')).toBe(true);
    expect(validDate('')).toBe(true);
  });
  it('persists the self-hosted flag that drives review intensity', () => {
    expect(profilePatchToRow({ selfHosted: true })).toEqual({ self_hosted: true });
  });
});

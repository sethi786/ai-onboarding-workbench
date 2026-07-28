import { describe, it, expect } from 'vitest';
import { auditToCsv, type AuditEvent } from '../audit-format';
import { fingerprint } from '../audit';

function event(over: Partial<AuditEvent> = {}): AuditEvent {
  return {
    id: 'e1',
    actor_email: 'owner@acme.com',
    action: 'assessment.decided',
    subject_type: 'assessment',
    subject_id: 'eval-1:security-sar',
    summary: 'Security / SAR decision recorded as "Approved".',
    metadata: { teamId: 'security-sar' },
    created_at: '2026-07-28T10:00:00.000Z',
    ...over,
  };
}

describe('auditToCsv', () => {
  it('writes a header and one row per event', () => {
    const lines = auditToCsv([event(), event({ id: 'e2' })]).split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('Timestamp');
  });

  it('escapes quotes so a summary cannot break out of its cell', () => {
    const csv = auditToCsv([event()]);
    expect(csv).toContain('""Approved""');
  });

  it('neutralises spreadsheet formula injection', () => {
    // Excel and Sheets execute any cell starting with =, +, - or @. This file is
    // built from names a user controls and is opened on an auditor's machine.
    for (const payload of ['=cmd|\'/c calc\'!A0', '+1+1', '-2+3', '@SUM(A1)']) {
      const csv = auditToCsv([event({ summary: payload })]);
      expect(csv, payload).toContain(`"'${payload}`);
      expect(csv, payload).not.toContain(`"${payload}"`);
    }
  });

  it('leaves ordinary text untouched', () => {
    const csv = auditToCsv([event({ summary: 'Approved with conditions' })]);
    expect(csv).toContain('"Approved with conditions"');
    expect(csv).not.toContain("\"'Approved");
  });

  it('handles a missing actor without producing the string "null"', () => {
    const csv = auditToCsv([event({ actor_email: null })]);
    expect(csv).toContain('"system"');
    expect(csv).not.toContain('null');
  });
});

describe('fingerprint', () => {
  it('is stable and length-aware', () => {
    const a = fingerprint('hello');
    expect(a.sha256).toBe(fingerprint('hello').sha256);
    expect(a.sha256).toHaveLength(64);
    expect(a.chars).toBe(5);
  });

  it('changes with the input, so it proves what was sent', () => {
    expect(fingerprint('a').sha256).not.toBe(fingerprint('b').sha256);
  });
});

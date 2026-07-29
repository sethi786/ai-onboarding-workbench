import { describe, it, expect } from 'vitest';
import {
  CADENCE_MONTHS,
  certificationStatus,
  certificationSummary,
  nextValidUntil,
} from '../recertification';

describe('certification state', () => {
  const on = (validUntil: string | null, today: string) =>
    certificationStatus({ validUntil, today });

  it('is not-certified until a clearance date exists', () => {
    expect(on(null, '2026-07-29').state).toBe('not-certified');
  });

  it('is current well before expiry', () => {
    const s = on('2027-01-01', '2026-07-29');
    expect(s.state).toBe('current');
    expect(s.daysRemaining).toBeGreaterThan(30);
  });

  it('warns inside the renewal window rather than at the cliff', () => {
    // Somebody has to start the re-review before the clearance lapses; telling
    // them on the day it expires is telling them too late.
    expect(on('2026-08-20', '2026-07-29').state).toBe('due-soon');
    expect(on('2026-07-30', '2026-07-29').state).toBe('due-soon');
  });

  it('is current on the boundary day and due the day after', () => {
    expect(on('2026-08-29', '2026-07-29').state).toBe('current');
    expect(on('2026-08-28', '2026-07-29').state).toBe('due-soon');
  });

  it('is still valid on its final day, expired the next', () => {
    expect(on('2026-07-29', '2026-07-29').state).toBe('due-soon');
    expect(on('2026-07-28', '2026-07-29').state).toBe('expired');
  });

  it('reports how long ago it lapsed', () => {
    const s = on('2026-06-29', '2026-07-29');
    expect(s.state).toBe('expired');
    expect(s.daysRemaining).toBe(-30);
  });

  it('does not crash on a malformed date', () => {
    expect(on('not-a-date', '2026-07-29').state).toBe('not-certified');
  });
});

describe('cadence', () => {
  it('is shorter the riskier the tool', () => {
    expect(CADENCE_MONTHS.Critical).toBeLessThan(CADENCE_MONTHS.High);
    expect(CADENCE_MONTHS.High).toBeLessThan(CADENCE_MONTHS.Medium);
    expect(CADENCE_MONTHS.Medium).toBeLessThan(CADENCE_MONTHS.Low);
  });

  it('sets the next date from the cadence', () => {
    expect(nextValidUntil('2026-07-29', 'Medium')).toBe('2027-07-29');
    expect(nextValidUntil('2026-07-29', 'High')).toBe('2027-01-29');
    expect(nextValidUntil('2026-07-29', 'Critical')).toBe('2026-10-29');
  });

  it('clamps rather than rolling over a short month', () => {
    // 31 January + 1 month is 28 February, not 3 March. A date that silently
    // jumps a month is the kind of detail that loses an argument with an auditor.
    expect(nextValidUntil('2026-08-31', 'Critical')).toBe('2026-11-30');
    expect(nextValidUntil('2027-11-30', 'Critical')).toBe('2028-02-29');
  });

  it('handles a full ISO timestamp as well as a date', () => {
    expect(nextValidUntil('2026-07-29T13:45:00Z', 'Medium')).toBe('2027-07-29');
  });
});

describe('summary line', () => {
  it('says something a reviewer can act on in each state', () => {
    expect(certificationSummary(certificationStatus({ validUntil: null, today: '2026-07-29' }), null))
      .toMatch(/not yet certified/i);
    expect(
      certificationSummary(
        certificationStatus({ validUntil: '2026-07-28', today: '2026-07-29' }),
        '2026-07-28',
      ),
    ).toMatch(/no longer cleared/i);
    expect(
      certificationSummary(
        certificationStatus({ validUntil: '2026-08-10', today: '2026-07-29' }),
        '2026-08-10',
      ),
    ).toMatch(/start the re-review/i);
  });
});

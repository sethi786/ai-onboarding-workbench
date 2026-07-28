import { describe, it, expect } from 'vitest';
import { TEAM_LENSES } from '../teamLenses';
import { CONTROL_GUIDANCE, EVIDENCE_GUIDANCE } from '../controlGuidance';

/**
 * Guidance is the difference between a review and a checkbox. These tests keep
 * it that way: a control added without a concrete definition of "done" fails
 * the build rather than shipping as a label somebody has to guess at.
 */
describe('control and evidence guidance', () => {
  const controls = TEAM_LENSES.flatMap((l) =>
    l.requiredControls.map((c) => ({ lens: l.title, ...c })),
  );
  const evidence = TEAM_LENSES.flatMap((l) =>
    l.evidenceRequired.map((e) => ({ lens: l.title, ...e })),
  );

  it('covers every control in every lens', () => {
    const missing = controls.filter((c) => !CONTROL_GUIDANCE[c.id]);
    expect(missing.map((c) => `${c.lens}: ${c.id} (${c.label})`)).toEqual([]);
  });

  it('covers every evidence item in every lens', () => {
    const missing = evidence.filter((e) => !EVIDENCE_GUIDANCE[e.id]);
    expect(missing.map((e) => `${e.lens}: ${e.id} (${e.label})`)).toEqual([]);
  });

  it('has no guidance for ids that no longer exist', () => {
    const controlIds = new Set(controls.map((c) => c.id));
    const evidenceIds = new Set(evidence.map((e) => e.id));
    expect(Object.keys(CONTROL_GUIDANCE).filter((id) => !controlIds.has(id))).toEqual([]);
    expect(Object.keys(EVIDENCE_GUIDANCE).filter((id) => !evidenceIds.has(id))).toEqual([]);
  });

  it('says something specific rather than restating the label', () => {
    for (const c of controls) {
      const g = CONTROL_GUIDANCE[c.id];
      // Long enough to carry a test, and not simply the label again.
      expect(g.length, `${c.id} guidance is too short to be useful`).toBeGreaterThan(40);
      expect(g.toLowerCase().trim()).not.toBe(c.label.toLowerCase().trim());
    }
    for (const e of evidence) {
      expect(EVIDENCE_GUIDANCE[e.id].length, `${e.id} guidance is too short`).toBeGreaterThan(20);
    }
  });
});

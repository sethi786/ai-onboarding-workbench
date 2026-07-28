import { describe, it, expect } from 'vitest';
import {
  similarity,
  recallForLens,
  summarizeRecall,
  applyRecall,
  recallCoverage,
  RECALL_THRESHOLD,
  type PriorAssessment,
} from '../memory';
import { LENS_BY_ID } from '../../data/teamLenses';
import { makeEmptyAssessment } from '../../types';
import type { Profile } from '../../types';

function profile(over: Partial<Profile> = {}): Profile {
  return {
    id: 'current',
    name: 'Current tool',
    platform: 'Acme Corp',
    toolCategory: 'SaaS application',
    toolType: 'Business SaaS application',
    useCase: '',
    businessOwner: '',
    technicalOwner: '',
    executiveSponsor: '',
    targetUsers: '',
    dataTypes: [],
    dataClassification: 'Internal',
    environment: 'Pilot',
    model: '',
    agentEnabled: false,
    connectorEnabled: false,
    ragEnabled: false,
    externalVendor: true,
    clientData: false,
    pii: false,
    autonomousActions: false,
    selfHosted: false,
    createdAt: '',
    updatedAt: '',
    ...over,
  };
}

const SAR = LENS_BY_ID['security-sar'];

function prior(over: Partial<PriorAssessment> = {}): PriorAssessment {
  return {
    evaluationId: 'prev-1',
    toolName: 'Previous tool',
    reviewedAt: '2026-03-01T00:00:00.000Z',
    profile: profile({ id: 'prev-1', name: 'Previous tool' }),
    teamId: 'security-sar',
    checkedControls: { 'sar-ctl-1': true, 'sar-ctl-3': true },
    checkedEvidence: { 'sar-e1': true },
    notes: 'SSO enforced through Okta with SCIM provisioning.',
    residualRisk: '',
    decision: 'Approved with Conditions',
    ...over,
  };
}

const ASKED = {
  controlIds: SAR.requiredControls.map((c) => c.id),
  evidenceIds: SAR.evidenceRequired.map((e) => e.id),
};

describe('similarity', () => {
  it('scores an identical tool profile near the top', () => {
    const s = similarity(profile(), profile());
    expect(s.score).toBeGreaterThan(0.9);
  });

  it('weights the vendor most heavily, because the vendor answers repeat verbatim', () => {
    const sameVendor = similarity(
      profile(),
      profile({ toolCategory: 'PaaS / cloud service', toolType: 'RAG assistant' }),
    );
    const sameShapeDifferentVendor = similarity(profile(), profile({ platform: 'Other Inc' }));
    expect(sameVendor.score).toBeGreaterThan(0);
    expect(sameVendor.reasons).toContain('same vendor');
    expect(sameShapeDifferentVendor.reasons).not.toContain('same vendor');
  });

  it('gives the reviewer reasons rather than a bare number', () => {
    const s = similarity(profile(), profile());
    expect(s.reasons.length).toBeGreaterThan(2);
    for (const r of s.reasons) expect(r).toMatch(/^same /);
  });

  it('scores two unrelated tools below the recall threshold', () => {
    const s = similarity(
      profile(),
      profile({
        platform: 'Different Vendor',
        toolCategory: 'On-premise software',
        toolType: 'Internal AI application',
        selfHosted: true,
        dataClassification: 'Restricted',
        connectorEnabled: true,
        ragEnabled: true,
        agentEnabled: true,
        pii: true,
      }),
    );
    expect(s.score).toBeLessThan(RECALL_THRESHOLD);
  });
});

describe('recallForLens', () => {
  it('recalls answers from a comparable earlier review', () => {
    const rec = recallForLens(SAR, profile(), [prior()], ASKED);
    const ids = rec.map((r) => r.itemId);
    expect(ids).toContain('sar-ctl-1');
    expect(ids).toContain('sar-ctl-3');
    expect(ids).toContain('sar-e1');
  });

  it('recalls nothing from a tool with too little in common', () => {
    const unrelated = prior({
      profile: profile({
        id: 'prev-1',
        platform: 'Unrelated Ltd',
        toolCategory: 'On-premise software',
        toolType: 'Internal AI application',
        selfHosted: true,
        dataClassification: 'Restricted',
        connectorEnabled: true,
        ragEnabled: true,
        agentEnabled: true,
        pii: true,
      }),
    });
    expect(recallForLens(SAR, profile(), [unrelated], ASKED)).toHaveLength(0);
  });

  it('only recalls controls that were actually answered', () => {
    // An unanswered control carries no information — it may never have been reached.
    const rec = recallForLens(SAR, profile(), [prior()], ASKED);
    expect(rec.map((r) => r.itemId)).not.toContain('sar-ctl-2');
  });

  it('never recalls from the evaluation being worked on', () => {
    const self = prior({ evaluationId: 'current' });
    expect(recallForLens(SAR, profile({ id: 'current' }), [self], ASKED)).toHaveLength(0);
  });

  it('ignores assessments from a different review team', () => {
    const otherLens = prior({ teamId: 'privacy-pia' });
    expect(recallForLens(SAR, profile(), [otherLens], ASKED)).toHaveLength(0);
  });

  it('prefers the most similar prior review, not merely the most recent', () => {
    const sameVendorOlder = prior({
      evaluationId: 'same-vendor',
      toolName: 'Acme Analytics',
      reviewedAt: '2025-01-01T00:00:00.000Z',
    });
    const otherVendorNewer = prior({
      evaluationId: 'other-vendor',
      toolName: 'Beta Tool',
      reviewedAt: '2026-06-01T00:00:00.000Z',
      profile: profile({ id: 'other-vendor', platform: 'Beta Inc' }),
    });
    const rec = recallForLens(SAR, profile(), [otherVendorNewer, sameVendorOlder], ASKED);
    expect(rec[0].source.toolName).toBe('Acme Analytics');
  });

  it('breaks a similarity tie with the newer review', () => {
    const older = prior({ evaluationId: 'a', toolName: 'Older', reviewedAt: '2025-01-01T00:00:00.000Z' });
    const newer = prior({ evaluationId: 'b', toolName: 'Newer', reviewedAt: '2026-06-01T00:00:00.000Z' });
    const rec = recallForLens(SAR, profile(), [older, newer], ASKED);
    expect(rec[0].source.toolName).toBe('Newer');
  });

  it('carries the reviewer note across so the answer has substance', () => {
    const rec = recallForLens(SAR, profile(), [prior()], ASKED);
    expect(rec[0].note).toMatch(/Okta/);
  });
});

describe('summarizeRecall', () => {
  it('counts controls and evidence separately and dedupes sources', () => {
    const rec = recallForLens(SAR, profile(), [prior()], ASKED);
    const s = summarizeRecall(rec);
    expect(s.controlCount).toBe(2);
    expect(s.evidenceCount).toBe(1);
    expect(s.sources).toHaveLength(1);
    expect(s.byItem['sar-ctl-1'].source.toolName).toBe('Previous tool');
  });
});

describe('applyRecall', () => {
  it('fills in what the reviewer has not answered', () => {
    const a = makeEmptyAssessment('security-sar');
    const rec = recallForLens(SAR, profile(), [prior()], ASKED);
    const { patch, appliedIds } = applyRecall(a, rec);
    expect(appliedIds).toHaveLength(3);
    expect(patch.checkedControls?.['sar-ctl-1']).toBe(true);
    expect(patch.checkedEvidence?.['sar-e1']).toBe(true);
  });

  it('never overwrites an answer the reviewer already gave', () => {
    const a = makeEmptyAssessment('security-sar');
    a.checkedControls['sar-ctl-1'] = true;
    const rec = recallForLens(SAR, profile(), [prior()], ASKED);
    const { appliedIds } = applyRecall(a, rec);
    expect(appliedIds).not.toContain('sar-ctl-1');
    expect(appliedIds).toHaveLength(2);
  });

  it('reports what it actually applied rather than what it was offered', () => {
    const a = makeEmptyAssessment('security-sar');
    a.checkedControls['sar-ctl-1'] = true;
    a.checkedControls['sar-ctl-3'] = true;
    a.checkedEvidence['sar-e1'] = true;
    const rec = recallForLens(SAR, profile(), [prior()], ASKED);
    expect(applyRecall(a, rec).appliedIds).toHaveLength(0);
  });

  it('leaves the assessment untouched when there is nothing to recall', () => {
    const a = makeEmptyAssessment('security-sar');
    const { appliedIds } = applyRecall(a, []);
    expect(appliedIds).toHaveLength(0);
  });
});

describe('recallCoverage', () => {
  it('is zero for a workspace with no history', () => {
    expect(recallCoverage([], 10)).toBe(0);
  });

  it('reports the share of a lens answerable from memory', () => {
    const rec = recallForLens(SAR, profile(), [prior()], ASKED);
    expect(recallCoverage(rec, 6)).toBeCloseTo(0.5);
  });

  it('never exceeds 1 and survives an empty lens', () => {
    const rec = recallForLens(SAR, profile(), [prior()], ASKED);
    expect(recallCoverage(rec, 1)).toBe(1);
    expect(recallCoverage(rec, 0)).toBe(0);
  });
});

describe('memory compounds', () => {
  it('recalls more as the workspace reviews more tools', () => {
    const reviews: PriorAssessment[] = [];
    const coverage: number[] = [];

    // Each new review answers a different slice of the same lens.
    for (let i = 0; i < 4; i++) {
      const controls: Record<string, boolean> = {};
      SAR.requiredControls.slice(i * 3, i * 3 + 3).forEach((c) => (controls[c.id] = true));
      reviews.push(
        prior({
          evaluationId: `prev-${i}`,
          toolName: `Tool ${i}`,
          checkedControls: controls,
          checkedEvidence: {},
        }),
      );
      coverage.push(recallForLens(SAR, profile(), reviews, ASKED).length);
    }

    // The whole premise of the feature: review ten is cheaper than review one.
    expect(coverage[3]).toBeGreaterThan(coverage[0]);
    expect(coverage).toEqual([...coverage].sort((a, b) => a - b));
  });
});

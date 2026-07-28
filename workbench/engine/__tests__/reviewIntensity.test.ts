import { describe, it, expect } from 'vitest';
import { isApplicable, isRequired, requiredLensIds, escalatedLensIds } from '../reviewIntensity';
import { TEAM_LENSES, LENS_BY_ID } from '../../data/teamLenses';
import type { Profile, ToolCategory, TeamId } from '../../types';

function profile(over: Partial<Profile> = {}): Profile {
  return {
    id: 'p1',
    name: 'Test tool',
    platform: 'Vendor',
    toolCategory: 'SaaS application',
    toolType: 'Business SaaS application',
    useCase: '',
    businessOwner: '',
    technicalOwner: '',
    executiveSponsor: '',
    targetUsers: '',
    dataTypes: [],
    dataClassification: 'Internal',
    environment: 'Sandbox',
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

const AI_ONLY = ['ai-enablement', 'ai-engineering', 'agent-governance'] as const;

describe('lens applicability by tool category', () => {
  it('skips AI-only lenses for a third-party SaaS app', () => {
    const p = profile({ toolCategory: 'SaaS application' });
    for (const id of AI_ONLY) {
      expect(isApplicable(LENS_BY_ID[id], p), `${id} should not apply`).toBe(false);
    }
  });

  it('applies AI-only lenses to an AI system', () => {
    const p = profile({ toolCategory: 'AI / ML system', toolType: 'RAG assistant' });
    for (const id of AI_ONLY) {
      expect(isApplicable(LENS_BY_ID[id], p), `${id} should apply`).toBe(true);
    }
  });

  it('applies AI lenses to a SaaS app that turns on AI capability', () => {
    // A CRM with an embedded assistant is still an AI review.
    const p = profile({ toolCategory: 'SaaS application', ragEnabled: true });
    expect(isApplicable(LENS_BY_ID['ai-engineering'], p)).toBe(true);
  });

  it('skips secure SDLC for software you neither build nor host', () => {
    const p = profile({ toolCategory: 'SaaS application', selfHosted: false });
    expect(isApplicable(LENS_BY_ID['secure-sdlc'], p)).toBe(false);
  });

  it('applies secure SDLC to on-premise, internal builds, and self-hosted tools', () => {
    const cases: Partial<Profile>[] = [
      { toolCategory: 'On-premise software' },
      { toolCategory: 'Internal build' },
      { toolCategory: 'SaaS application', selfHosted: true },
    ];
    for (const over of cases) {
      expect(isApplicable(LENS_BY_ID['secure-sdlc'], profile(over))).toBe(true);
    }
  });

  it('keeps universal lenses applicable to every category', () => {
    const universal: TeamId[] = ['security-sar', 'privacy-pia', 'legal', 'qrm-risk', 'go-no-go'];
    const categories: ToolCategory[] = [
      'SaaS application',
      'PaaS / cloud service',
      'On-premise software',
      'AI / ML system',
      'Internal build',
    ];
    for (const c of categories) {
      for (const id of universal) {
        expect(isApplicable(LENS_BY_ID[id], profile({ toolCategory: c }))).toBe(true);
      }
    }
  });
});

describe('applicability beats requirement', () => {
  it('does not require an inapplicable lens even in Production', () => {
    // Production forces everything required — except things that don't apply.
    const p = profile({ toolCategory: 'SaaS application', environment: 'Production' });
    expect(isRequired(LENS_BY_ID['ai-engineering'], p)).toBe(false);
    expect(isRequired(LENS_BY_ID['secure-sdlc'], p)).toBe(false);
    // ...while an applicable lens is required in Production.
    expect(isRequired(LENS_BY_ID['security-sar'], p)).toBe(true);
  });

  it('does not require an inapplicable lens marked alwaysRequired', () => {
    const p = profile({ toolCategory: 'SaaS application' });
    expect(LENS_BY_ID['ai-enablement'].alwaysRequired).toBe(true);
    expect(isRequired(LENS_BY_ID['ai-enablement'], p)).toBe(false);
  });

  it('gives a SaaS app a smaller required set than an equivalent AI system', () => {
    const saas = requiredLensIds(TEAM_LENSES, profile({ environment: 'Production' }));
    const ai = requiredLensIds(
      TEAM_LENSES,
      profile({ toolCategory: 'AI / ML system', environment: 'Production' }),
    );
    expect(saas.length).toBeLessThan(ai.length);
    expect(saas).not.toContain('ai-engineering');
    expect(ai).toContain('ai-engineering');
  });
});

describe('escalation', () => {
  it('escalates build and platform review when self-hosted', () => {
    const set = escalatedLensIds(profile({ selfHosted: true }));
    expect(set.has('secure-sdlc')).toBe(true);
    expect(set.has('platform-cloud')).toBe(true);
    expect(set.has('security-sar')).toBe(true);
  });

  it('does not escalate self-hosted lenses for a vendor-run SaaS app', () => {
    const set = escalatedLensIds(profile({ selfHosted: false, externalVendor: false }));
    expect(set.has('secure-sdlc')).toBe(false);
  });

  it('still escalates privacy for personal data on any category', () => {
    const set = escalatedLensIds(profile({ toolCategory: 'SaaS application', pii: true }));
    expect(set.has('privacy-pia')).toBe(true);
    expect(set.has('data-governance')).toBe(true);
  });
});

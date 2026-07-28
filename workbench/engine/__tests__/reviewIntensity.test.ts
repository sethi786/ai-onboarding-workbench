import { describe, it, expect } from 'vitest';
import {
  isApplicable,
  isRequired,
  requiredLensIds,
  escalatedLensIds,
  baseDepth,
  reviewDepth,
  controlsAtDepth,
  evidenceAtDepth,
  depthRationale,
} from '../reviewIntensity';
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
    const p = profile({ toolCategory: 'SaaS application', environment: 'Production' });
    expect(isRequired(LENS_BY_ID['ai-engineering'], p)).toBe(false);
    expect(isRequired(LENS_BY_ID['secure-sdlc'], p)).toBe(false);
    // ...while an applicable lens is required in Production.
    expect(isRequired(LENS_BY_ID['security-sar'], p)).toBe(true);
  });

  it('does not require an inapplicable lens marked alwaysRequired', () => {
    // Secure SDLC is unconditional *within its scope* — and its scope is
    // software you build or host, not a vendor-run SaaS.
    const p = profile({ toolCategory: 'SaaS application', selfHosted: false });
    expect(LENS_BY_ID['secure-sdlc'].alwaysRequired).toBe(true);
    expect(isRequired(LENS_BY_ID['secure-sdlc'], p)).toBe(false);
    expect(isRequired(LENS_BY_ID['secure-sdlc'], profile({ selfHosted: true }))).toBe(true);
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

describe('requirement is triggered, not assumed', () => {
  it('asks only the unconditional lenses of a sandbox tool with nothing at stake', () => {
    const ids = requiredLensIds(TEAM_LENSES, profile({ dataClassification: 'Public' }));
    // Somebody owns the business case, somebody looks at security, somebody
    // makes the call. Nothing else has been given a reason to care yet.
    expect(ids).toEqual(expect.arrayContaining(['business', 'security-sar', 'go-no-go']));
    expect(ids).not.toContain('privacy-pia');
    expect(ids).not.toContain('enterprise-architecture');
    expect(ids).not.toContain('finance');
    expect(ids.length).toBeLessThanOrEqual(6);
  });

  it('summons each specialist lens from the fact that actually concerns it', () => {
    const cases: [Partial<Profile>, TeamId][] = [
      [{ pii: true }, 'privacy-pia'],
      [{ ragEnabled: true }, 'data-governance'],
      [{ connectorEnabled: true }, 'connector-governance'],
      [{ agentEnabled: true }, 'agent-governance'],
      [{ externalVendor: true }, 'vendor-risk'],
      [{ selfHosted: true }, 'platform-cloud'],
      [{ toolCategory: 'Internal build', selfHosted: true }, 'solution-architecture'],
    ];
    for (const [trigger, lensId] of cases) {
      const without = requiredLensIds(TEAM_LENSES, profile({ externalVendor: false }));
      const withIt = requiredLensIds(TEAM_LENSES, profile({ externalVendor: false, ...trigger }));
      expect(without, `${lensId} required with no trigger`).not.toContain(lensId);
      expect(withIt, `${lensId} not summoned by its trigger`).toContain(lensId);
    }
  });

  it('does not summon architecture review for a vendor SaaS just because it went live', () => {
    // The old rule required every applicable lens in Production, which is how a
    // note-taking app ended up owing an enterprise architecture review.
    const ids = requiredLensIds(TEAM_LENSES, profile({ environment: 'Production' }));
    expect(ids).not.toContain('enterprise-architecture');
    expect(ids).not.toContain('solution-architecture');
    // ...but the lenses that care about live users are summoned.
    expect(ids).toContain('operations');
    expect(ids).toContain('adoption');
  });
});

describe('review depth', () => {
  it('screens a low-exposure tool and goes deep on a high-exposure one', () => {
    expect(baseDepth(profile({ dataClassification: 'Public' }))).toBe('Screening');
    expect(baseDepth(profile({ environment: 'Pilot' }))).toBe('Standard');
    expect(
      baseDepth(
        profile({
          environment: 'Production',
          dataClassification: 'Restricted',
          pii: true,
          clientData: true,
        }),
      ),
    ).toBe('Deep');
  });

  it('asks only make-or-break controls at Screening, and no documents at all', () => {
    const lens = LENS_BY_ID['security-sar'];
    const screening = controlsAtDepth(lens, 'Screening');
    expect(screening.length).toBeGreaterThan(0);
    expect(screening.every((c) => c.critical)).toBe(true);
    expect(screening.length).toBeLessThan(lens.requiredControls.length);
    // Screening is a questionnaire pass, not a document hunt.
    expect(evidenceAtDepth(lens, 'Screening')).toHaveLength(0);
  });

  it('holds back the expensive artifacts until Deep', () => {
    const lens = LENS_BY_ID['security-sar'];
    const standard = evidenceAtDepth(lens, 'Standard');
    const deep = evidenceAtDepth(lens, 'Deep');
    expect(deep.length).toBeGreaterThan(standard.length);
    // A pen test is weeks and real money; it has no business gating a pilot.
    expect(standard.map((e) => e.id)).not.toContain('sar-e10');
    expect(deep.map((e) => e.id)).toContain('sar-e10');
  });

  it('deepens only the lens the risk actually concerns', () => {
    const p = profile({ environment: 'Pilot', pii: true });
    expect(baseDepth(p)).toBe('Standard');
    // Personal data escalates privacy, and leaves finance where it was.
    expect(reviewDepth(LENS_BY_ID['privacy-pia'], p)).toBe('Deep');
    expect(reviewDepth(LENS_BY_ID['finance'], p)).toBe('Standard');
  });

  it('keeps the total burden proportionate to what is at stake', () => {
    const count = (p: Profile) =>
      TEAM_LENSES.filter((l) => isRequired(l, p)).reduce(
        (n, l) => n + controlsAtDepth(l, reviewDepth(l, p)).length,
        0,
      );

    const sandbox = count(profile({ dataClassification: 'Public' }));
    const pilot = count(profile({ environment: 'Pilot', dataClassification: 'Confidential' }));
    const production = count(
      profile({
        environment: 'Production',
        dataClassification: 'Restricted',
        pii: true,
        clientData: true,
        connectorEnabled: true,
      }),
    );

    expect(sandbox).toBeLessThan(pilot);
    expect(pilot).toBeLessThan(production);
    // The specific number matters: a sandbox trial that costs 100+ controls is
    // a process people route around, which is the problem this tool sells against.
    expect(sandbox).toBeLessThanOrEqual(30);
  });

  it('explains its depth in terms a reviewer can act on', () => {
    const p = profile({ environment: 'Production', pii: true });
    const why = depthRationale(LENS_BY_ID['privacy-pia'], p);
    expect(why).toMatch(/Deep/);
    expect(why).toMatch(/personal data|production/);
    expect(depthRationale(LENS_BY_ID['business'], profile({ dataClassification: 'Public' })))
      .toMatch(/Screening/);
  });
});

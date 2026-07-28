import { describe, it, expect } from 'vitest';
import { coverageFor, allCoverage } from '../frameworkCoverage';
import { FRAMEWORK_BY_ID, frameworksFor } from '../../data/frameworks';
import { TEAM_LENSES, LENS_BY_ID } from '../../data/teamLenses';
import { isRequired, reviewDepth, controlsAtDepth, evidenceAtDepth } from '../reviewIntensity';
import { makeEmptyAssessment } from '../../types';
import type { Profile, TeamAssessment, TeamId } from '../../types';

function profile(over: Partial<Profile> = {}): Profile {
  return {
    id: 'p',
    name: 'Tool',
    platform: 'Vendor',
    toolCategory: 'AI / ML system',
    toolType: 'RAG assistant',
    useCase: '',
    businessOwner: '',
    technicalOwner: '',
    executiveSponsor: '',
    targetUsers: '',
    dataTypes: [],
    dataClassification: 'Confidential',
    environment: 'Production',
    model: '',
    agentEnabled: false,
    connectorEnabled: true,
    ragEnabled: true,
    externalVendor: true,
    clientData: false,
    pii: true,
    autonomousActions: false,
    selfHosted: false,
    createdAt: '',
    updatedAt: '',
    ...over,
  };
}

function emptyMap(): Record<TeamId, TeamAssessment> {
  const m = {} as Record<TeamId, TeamAssessment>;
  for (const l of TEAM_LENSES) m[l.id] = makeEmptyAssessment(l.id);
  return m;
}

/** Answer everything a lens asks at this tool's depth. */
function completeLens(map: Record<TeamId, TeamAssessment>, id: TeamId, p: Profile) {
  const lens = LENS_BY_ID[id];
  const depth = reviewDepth(lens, p);
  controlsAtDepth(lens, depth).forEach((c) => (map[id].checkedControls[c.id] = true));
  evidenceAtDepth(lens, depth).forEach((e) => (map[id].checkedEvidence[e.id] = true));
}

const get = (m: Record<TeamId, TeamAssessment>) => (id: TeamId) => m[id] ?? makeEmptyAssessment(id);

describe('framework applicability', () => {
  it('brings AI frameworks into play only for AI systems', () => {
    expect(frameworksFor(profile()).map((f) => f.id)).toContain('eu-ai-act');
    const crm = profile({
      toolCategory: 'SaaS application',
      toolType: 'Business SaaS application',
      ragEnabled: false,
      agentEnabled: false,
      autonomousActions: false,
    });
    expect(frameworksFor(crm)).toHaveLength(0);
  });

  it('applies to a conventional tool that switches on AI capability', () => {
    const crmWithAi = profile({ toolCategory: 'SaaS application', ragEnabled: true });
    expect(frameworksFor(crmWithAi).map((f) => f.id)).toContain('eu-ai-act');
  });
});

describe('coverage is earned, not assumed', () => {
  it('reports every clause open when nothing has been answered', () => {
    const p = profile();
    const cov = coverageFor(FRAMEWORK_BY_ID['eu-ai-act'], p, TEAM_LENSES, get(emptyMap()));
    expect(cov.covered).toBe(0);
    expect(cov.completeness).toBe(0);
    const inScope = cov.clauses.filter((c) => c.status !== 'out-of-scope');
    expect(inScope.length).toBeGreaterThan(0);
    for (const c of inScope) expect(c.status).toBe('open');
  });

  it('marks a clause covered only when every mapped lens is complete', () => {
    const p = profile();
    const map = emptyMap();
    const clause = FRAMEWORK_BY_ID['eu-ai-act'].clauses.find((c) => c.id === 'art-15')!;

    // Complete one of the two mapped lenses — partial, not covered.
    completeLens(map, clause.lenses[0], p);
    let cov = coverageFor(FRAMEWORK_BY_ID['eu-ai-act'], p, TEAM_LENSES, get(map));
    let art15 = cov.clauses.find((c) => c.clause.id === 'art-15')!;
    expect(art15.status).toBe('partial');

    for (const id of clause.lenses) completeLens(map, id, p);
    cov = coverageFor(FRAMEWORK_BY_ID['eu-ai-act'], p, TEAM_LENSES, get(map));
    art15 = cov.clauses.find((c) => c.clause.id === 'art-15')!;
    expect(art15.status).toBe('covered');
    expect(art15.completeness).toBeCloseTo(1);
  });

  it('names the open items instead of only scoring them', () => {
    const p = profile();
    const cov = coverageFor(FRAMEWORK_BY_ID['eu-ai-act'], p, TEAM_LENSES, get(emptyMap()));
    const art9 = cov.clauses.find((c) => c.clause.id === 'art-9')!;
    expect(art9.openItems.length).toBeGreaterThan(0);
    // Each gap names its lens so a reviewer knows where to go.
    for (const item of art9.openItems) expect(item).toContain(':');
  });
});

describe('scope honesty', () => {
  it('marks a clause out of scope rather than failing it when no required lens maps to it', () => {
    // Sandbox: almost nothing is required, so most clauses have no evidence path.
    const p = profile({ environment: 'Sandbox', dataClassification: 'Public', pii: false, connectorEnabled: false, ragEnabled: true });
    const cov = coverageFor(FRAMEWORK_BY_ID['eu-ai-act'], p, TEAM_LENSES, get(emptyMap()));
    const outOfScope = cov.clauses.filter((c) => c.status === 'out-of-scope');
    expect(outOfScope.length).toBeGreaterThan(0);
    // Out-of-scope clauses are excluded from the completeness average rather
    // than dragging it to zero.
    for (const c of outOfScope) expect(c.contributingLenses).toHaveLength(0);
  });

  it('explains which mapped lenses did not apply', () => {
    const p = profile({ environment: 'Sandbox', dataClassification: 'Public', pii: false, ragEnabled: true });
    const cov = coverageFor(FRAMEWORK_BY_ID['eu-ai-act'], p, TEAM_LENSES, get(emptyMap()));
    const withExplanation = cov.clauses.filter((c) => c.inapplicableLenses.length > 0);
    expect(withExplanation.length).toBeGreaterThan(0);
  });

  it('only credits lenses that are actually required for this tool', () => {
    const p = profile();
    const map = emptyMap();
    // Complete a lens that is not required here; it must not move coverage.
    const notRequired = TEAM_LENSES.find((l) => !isRequired(l, p));
    if (notRequired) {
      completeLens(map, notRequired.id, p);
      const cov = coverageFor(FRAMEWORK_BY_ID['eu-ai-act'], p, TEAM_LENSES, get(map));
      const touched = cov.clauses.some((c) =>
        c.contributingLenses.some((l) => l.id === notRequired.id),
      );
      expect(touched).toBe(false);
    }
  });
});

describe('allCoverage', () => {
  it('returns every framework in play with citable references', () => {
    const all = allCoverage(profile(), TEAM_LENSES, get(emptyMap()));
    expect(all.map((c) => c.framework.id)).toEqual(['eu-ai-act', 'iso-42001', 'nist-ai-rmf']);
    for (const f of all) {
      for (const c of f.clauses) {
        // A reviewer has to be able to cite this back to the regulation.
        expect(c.clause.ref).toMatch(/^(Article|A\.|GOVERN|MAP|MEASURE|MANAGE)/);
        expect(c.clause.requires.length).toBeGreaterThan(20);
      }
    }
  });

  it('returns nothing for a tool no AI framework applies to', () => {
    const crm = profile({
      toolCategory: 'SaaS application',
      toolType: 'Business SaaS application',
      ragEnabled: false,
    });
    expect(allCoverage(crm, TEAM_LENSES, get(emptyMap()))).toHaveLength(0);
  });
});

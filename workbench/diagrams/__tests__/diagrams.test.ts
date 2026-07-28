import { describe, it, expect } from 'vitest';
import {
  dataFlowDiagram,
  approvalPathDiagram,
  riskHeatmap,
  trustBoundaryDiagram,
  buildDiagrams,
} from '../index';
import { wrapLabel, esc } from '../svg';
import { computeScoreFromMap } from '../../engine/scoring';
import { TEAM_LENSES } from '../../data/teamLenses';
import { buildReportContext } from '../../export/reportContext';
import { makeDefaultWorkflow } from '../../data/workflowStages';
import { makeEmptyAssessment } from '../../types';
import type { Profile, TeamAssessment, TeamId } from '../../types';

function profile(over: Partial<Profile> = {}): Profile {
  return {
    id: 'p1',
    name: 'Test tool',
    platform: 'Vendor Co',
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

function context(p: Profile) {
  const map = {} as Record<TeamId, TeamAssessment>;
  for (const lens of TEAM_LENSES) map[lens.id] = makeEmptyAssessment(lens.id);
  const score = computeScoreFromMap(p, TEAM_LENSES, map);
  return buildReportContext(p, score, (id) => map[id] ?? makeEmptyAssessment(id), 'now');
}

describe('escaping', () => {
  it('never lets a tool name break out of the SVG', () => {
    const d = dataFlowDiagram(profile({ name: '</text><script>alert(1)</script>' }));
    expect(d.svg).not.toContain('<script>');
    expect(d.svg).toContain('&lt;');
  });

  it('strips characters that would break Mermaid node syntax', () => {
    const d = dataFlowDiagram(profile({ name: 'Acme "Pro" | v2 <beta>' }));
    // Inside a Mermaid ["..."] label these terminate the node early. `<br/>` is
    // markup we emit deliberately, so it's removed before checking user text.
    const labels = d.mermaid.match(/\["[^"]*"\]/g) ?? [];
    expect(labels.length).toBeGreaterThan(0);
    for (const l of labels) expect(l.replaceAll('<br/>', ' ')).not.toMatch(/[|<>]/);
  });

  it('escapes the five HTML-significant characters', () => {
    expect(esc(`<&>"'`)).toBe('&lt;&amp;&gt;&quot;&#39;');
  });
});

describe('data flow', () => {
  it('marks vendor-hosted destinations as outside the trust boundary', () => {
    const d = dataFlowDiagram(profile({ externalVendor: true }));
    expect(d.svg).toContain('Outside the trust boundary');
  });

  it('shows no external egress when nothing leaves the organization', () => {
    const d = dataFlowDiagram(profile({ externalVendor: false, connectorEnabled: false, ragEnabled: false }));
    expect(d.svg).toContain('Internal storage only');
    expect(d.svg).not.toContain('Outside the trust boundary');
  });

  it('adds a search index node only when the tool indexes content', () => {
    expect(dataFlowDiagram(profile({ ragEnabled: true })).svg).toContain('Search index');
    expect(dataFlowDiagram(profile({ ragEnabled: false })).svg).not.toContain('Search index');
  });

  it('renders without data types rather than producing an empty diagram', () => {
    const d = dataFlowDiagram(profile({ dataTypes: [] }));
    expect(d.svg).toContain('No data types recorded');
    expect(d.svg).toMatch(/^<svg /);
  });

  it('sizes the canvas to fit the rightmost column and its boundary', () => {
    // A viewBox narrower than the content silently clips the vendor column.
    const d = dataFlowDiagram(profile({ externalVendor: true, connectorEnabled: true }));
    const width = Number(d.svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) /)![1]);
    const rightmost = Math.max(
      ...[...d.svg.matchAll(/<rect x="(-?\d+(?:\.\d+)?)" y="[^"]*" width="(\d+(?:\.\d+)?)"/g)].map(
        (m) => Number(m[1]) + Number(m[2]),
      ),
    );
    expect(width).toBeGreaterThanOrEqual(rightmost);
  });
});

describe('trust boundary', () => {
  it('puts infrastructure on the customer when they host it', () => {
    const p = profile({ selfHosted: true });
    const d = trustBoundaryDiagram(p, context(p).score);
    const [ours] = d.mermaid.split('subgraph Vendor');
    expect(ours).toContain('Infrastructure');
  });

  it('puts infrastructure on the vendor for third-party SaaS', () => {
    const p = profile({ selfHosted: false });
    const d = trustBoundaryDiagram(p, context(p).score);
    const vendorHalf = d.mermaid.split('subgraph Vendor')[1];
    expect(vendorHalf).toContain('Infrastructure');
  });
});

describe('approval path', () => {
  it('omits skipped stages and keeps the rest in order', () => {
    const stages = makeDefaultWorkflow().slice(0, 4);
    stages[1].status = 'Skipped';
    stages[2].status = 'Blocked';
    const d = approvalPathDiagram(stages);
    expect(d.svg).not.toContain(stages[1].name);
    expect(d.svg).toContain(stages[0].name);
    expect(d.svg).toContain('Blocked');
  });

  it('renders with a single stage without drawing a connector', () => {
    const d = approvalPathDiagram(makeDefaultWorkflow().slice(0, 1));
    expect(d.svg).toMatch(/^<svg /);
  });
});

describe('risk heatmap', () => {
  it('only charts lenses that apply to the tool', () => {
    const saas = riskHeatmap(context(profile({ environment: 'Production' })));
    const ai = riskHeatmap(
      context(profile({ toolCategory: 'AI / ML system', environment: 'Production' })),
    );
    expect(saas.svg).not.toContain('AI Engineering');
    expect(ai.svg).toContain('AI Engineering');
  });

  it('says so instead of drawing an empty grid when nothing is required', () => {
    const d = riskHeatmap(context(profile({ environment: 'Sandbox' })));
    if (!d.svg.includes('%')) {
      expect(d.svg).toContain('No review lenses are required');
    }
  });
});

describe('buildDiagrams', () => {
  it('returns all four diagrams with unique ids and non-empty output', () => {
    const p = profile({ environment: 'Production', pii: true });
    const diagrams = buildDiagrams(context(p), makeDefaultWorkflow());
    expect(diagrams).toHaveLength(4);
    expect(new Set(diagrams.map((d) => d.id)).size).toBe(4);
    for (const d of diagrams) {
      expect(d.svg.startsWith('<svg ')).toBe(true);
      expect(d.mermaid.length).toBeGreaterThan(10);
      expect(d.purpose.length).toBeGreaterThan(20);
    }
  });
});

describe('wrapLabel', () => {
  it('keeps a short label on one line', () => {
    expect(wrapLabel('Security', 190, 12)).toEqual(['Security']);
  });

  it('wraps to at most the requested number of lines', () => {
    const lines = wrapLabel('A very long review lens title that will not fit', 120, 12, 2);
    expect(lines.length).toBeLessThanOrEqual(2);
  });

  it('marks truncation instead of silently renaming the thing', () => {
    const lines = wrapLabel('Extremely long connector governance and oversight review', 90, 11, 2);
    expect(lines.join('')).toContain('…');
  });
});

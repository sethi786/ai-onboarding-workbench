import type { Profile, ScoreResult, WorkflowStage, DocumentBrand } from '../types';
import type { ReportContext } from '../export/reportContext';
import {
  type Box,
  arrow,
  centeredText,
  esc,
  label,
  rect,
  svgDocument,
  wrapLabel,
} from './svg';

/**
 * Diagrams generated from what the workspace already answered.
 *
 * Reviewers ask for a data flow diagram, an approval path, and a risk view in
 * almost every process — and teams redraw them by hand in a slide deck each
 * time, where they immediately drift from the assessment. These are derived
 * from the evaluation itself, so they can't disagree with it.
 *
 * Each diagram emits two forms: inline SVG (renders in the app and inside the
 * printable export, no library, no network) and Mermaid source (pasteable into
 * Confluence, Notion, or a GitHub PR, where teams want to keep editing it).
 */

export type DiagramId = 'data-flow' | 'approval-path' | 'risk-heatmap' | 'trust-boundary';

export interface Diagram {
  id: DiagramId;
  title: string;
  /** What a reviewer is meant to take from it. */
  purpose: string;
  svg: string;
  mermaid: string;
}

const INK = '#1A1A1A';
const MUTED = '#6B6B6B';
const LINE = '#D8D3C9';
const SURFACE = '#F7F5F1';
const OK = '#1D5C43';
const WARN = '#9A6B12';
const DANGER = '#8C2018';

function tone(pct: number): { fill: string; stroke: string; text: string } {
  if (pct >= 70) return { fill: '#E7F2EC', stroke: '#9FC9B5', text: OK };
  if (pct >= 40) return { fill: '#FBF0DA', stroke: '#E0C48A', text: WARN };
  return { fill: '#FBE4E2', stroke: '#E6ADA7', text: DANGER };
}

/* ---------------------------------------------------------------- data flow */

interface FlowNode {
  id: string;
  label: string;
  sub: string;
  box: Box;
  accent?: string;
}

/**
 * Where the data actually goes: who uses the tool, what it holds, what it
 * reaches into, and whether any of it leaves the organization. This is the
 * diagram a security or privacy reviewer asks for first.
 */
export function dataFlowDiagram(profile: Profile, brand?: DocumentBrand): Diagram {
  const accent = brand?.primaryColor ?? '#1F5F4E';
  const colW = 190;
  const gap = 40;
  const boxH = 74;

  const sources: string[] = profile.dataTypes.length
    ? profile.dataTypes.slice(0, 4)
    : ['No data types recorded'];

  const destinations: FlowNode[] = [];
  if (profile.connectorEnabled) {
    destinations.push({ id: 'connectors', label: 'Connected systems', sub: 'via connectors', box: { x: 0, y: 0, w: colW, h: boxH } });
  }
  if (profile.ragEnabled) {
    destinations.push({ id: 'index', label: 'Search index', sub: 'indexed content', box: { x: 0, y: 0, w: colW, h: boxH } });
  }
  if (profile.externalVendor) {
    destinations.push({ id: 'vendor', label: `${profile.platform || 'Vendor'} cloud`, sub: 'outside the org', box: { x: 0, y: 0, w: colW, h: boxH }, accent: DANGER });
  }
  if (destinations.length === 0) {
    destinations.push({ id: 'internal', label: 'Internal storage only', sub: 'no external egress', box: { x: 0, y: 0, w: colW, h: boxH }, accent: OK });
  }

  const rows = Math.max(sources.length, destinations.length, 1);
  const topPad = 58;
  const rowH = boxH + 18;
  const H = topPad + rows * rowH + 54;

  const colX = [30, 30 + colW + gap, 30 + 2 * (colW + gap), 30 + 3 * (colW + gap)];
  // Four columns plus the dashed trust boundary that overhangs the last one.
  const W = colX[3] + colW + 30 + 14;
  const centerY = topPad + (rows * rowH) / 2 - boxH / 2;

  const userBox: Box = { x: colX[0], y: centerY, w: colW, h: boxH };
  const toolBox: Box = { x: colX[1], y: centerY, w: colW, h: boxH };

  const sourceBoxes: FlowNode[] = sources.map((s, i) => ({
    id: `src-${i}`,
    label: s,
    sub: profile.dataClassification,
    box: { x: colX[2], y: topPad + i * rowH, w: colW, h: boxH },
  }));

  destinations.forEach((d, i) => {
    d.box = { x: colX[3], y: topPad + i * rowH, w: colW, h: boxH };
  });

  const parts: string[] = [];

  // Trust boundary around anything the organization doesn't run itself.
  if (profile.externalVendor || profile.selfHosted === false) {
    const vendorNodes = destinations.filter((d) => d.id === 'vendor');
    if (vendorNodes.length) {
      const b = vendorNodes[0].box;
      parts.push(
        rect({ x: b.x - 12, y: 36, w: b.w + 24, h: H - 76 }, {
          fill: 'none',
          stroke: DANGER,
          dashed: true,
          radius: 12,
          strokeWidth: 1,
        }),
        label(b.x + b.w / 2, 26, 'Outside the trust boundary', {
          fontSize: 11,
          fill: DANGER,
          anchor: 'middle',
          weight: 600,
        }),
      );
    }
  }

  const node = (box: Box, title: string, sub: string, stroke: string, fill: string) =>
    rect(box, { fill, stroke }) +
    centeredText(box, wrapLabel(title, box.w, 12.5), { fontSize: 12.5, fill: INK, weight: 600, offsetY: -7 }) +
    label(box.x + box.w / 2, box.y + box.h - 14, sub, { fontSize: 10.5, fill: MUTED, anchor: 'middle', weight: 400 });

  parts.push(node(userBox, profile.targetUsers || 'Users', 'internal users', LINE, '#FFFFFF'));
  parts.push(node(toolBox, profile.name, profile.toolCategory, accent, SURFACE));
  for (const s of sourceBoxes) {
    parts.push(node(s.box, s.label, s.sub, LINE, '#FFFFFF'));
    parts.push(arrow(toolBox, s.box, '#8A8A8A'));
  }
  for (const d of destinations) {
    parts.push(node(d.box, d.label, d.sub, d.accent ?? LINE, '#FFFFFF'));
  }
  parts.push(arrow(userBox, toolBox, '#8A8A8A'));

  // All of the data lands in all of the destinations, so the flow collapses
  // onto a single spine rather than drawing every source-to-destination pair —
  // a dozen crossing arrows would say less than one.
  const spineX = colX[2] + colW + gap / 2;
  const spineTop = sourceBoxes[0].box.y + boxH / 2;
  const spineBottom = sourceBoxes[sourceBoxes.length - 1].box.y + boxH / 2;
  for (const s of sourceBoxes) {
    const y = s.box.y + boxH / 2;
    parts.push(
      `<path d="M ${s.box.x + s.box.w} ${y} L ${spineX} ${y}" fill="none" stroke="#8A8A8A" stroke-width="1.5" />`,
    );
  }
  if (spineBottom > spineTop) {
    parts.push(
      `<path d="M ${spineX} ${spineTop} L ${spineX} ${spineBottom}" fill="none" stroke="#8A8A8A" stroke-width="1.5" />`,
    );
  }
  parts.push(`<circle cx="${spineX}" cy="${spineTop}" r="2.5" fill="#8A8A8A" />`);
  for (const d of destinations) {
    const y = d.box.y + boxH / 2;
    parts.push(
      `<path d="M ${spineX} ${Math.min(Math.max(y, spineTop), spineBottom)} C ${
        spineX + gap / 2
      } ${Math.min(Math.max(y, spineTop), spineBottom)}, ${spineX + gap / 2} ${y}, ${
        d.box.x - 8
      } ${y}" fill="none" stroke="#8A8A8A" stroke-width="1.5" marker-end="url(#arrowhead)" />`,
    );
  }

  const flags = [
    profile.pii && 'Personal data',
    profile.clientData && 'Client data',
    profile.agentEnabled && 'Agent',
    profile.autonomousActions && 'Autonomous actions',
  ].filter(Boolean) as string[];
  if (flags.length) {
    parts.push(
      label(30, H - 20, `Handling flags: ${flags.join(' · ')}`, { fontSize: 11, fill: MUTED, weight: 400 }),
    );
  }

  const mermaidNodes = [
    `  U["${mmd(profile.targetUsers || 'Users')}"] --> T["${mmd(profile.name)}"]`,
    ...sources.map((s, i) => `  T --> S${i}["${mmd(s)}<br/>${mmd(profile.dataClassification)}"]`),
    ...destinations.map((d, i) => `  S0 --> D${i}["${mmd(d.label)}<br/>${mmd(d.sub)}"]`),
  ];

  return {
    id: 'data-flow',
    title: 'Data flow',
    purpose:
      'Shows which users touch the tool, what data it handles, and where that data goes — including anything that crosses outside the organization.',
    svg: svgDocument(W, H, parts.join(''), 'Data flow diagram'),
    mermaid: ['flowchart LR', ...mermaidNodes].join('\n'),
  };
}

/* ------------------------------------------------------------ approval path */

const STAGE_TONE: Record<string, { fill: string; stroke: string; text: string }> = {
  Complete: { fill: '#E7F2EC', stroke: '#9FC9B5', text: OK },
  'In Progress': { fill: '#FBF0DA', stroke: '#E0C48A', text: WARN },
  Blocked: { fill: '#FBE4E2', stroke: '#E6ADA7', text: DANGER },
  Skipped: { fill: '#F1EFEA', stroke: LINE, text: MUTED },
  'Not Started': { fill: '#FFFFFF', stroke: LINE, text: MUTED },
};

/**
 * The approval path with live status. Answers "where is this stuck and who has
 * it" without anybody maintaining a status slide.
 */
export function approvalPathDiagram(stages: WorkflowStage[]): Diagram {
  const active = stages.filter((s) => s.status !== 'Skipped');
  const perRow = 4;
  const boxW = 190;
  const boxH = 64;
  const gapX = 26;
  const gapY = 30;
  const W = 30 * 2 + perRow * boxW + (perRow - 1) * gapX;
  const rows = Math.max(1, Math.ceil(active.length / perRow));
  const H = 30 * 2 + rows * boxH + (rows - 1) * gapY;

  const parts: string[] = [];
  const boxes: Box[] = [];

  active.forEach((stage, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const box: Box = {
      x: 30 + col * (boxW + gapX),
      y: 30 + row * (boxH + gapY),
      w: boxW,
      h: boxH,
    };
    boxes.push(box);
    const t = STAGE_TONE[stage.status] ?? STAGE_TONE['Not Started'];
    parts.push(rect(box, { fill: t.fill, stroke: t.stroke }));
    parts.push(
      centeredText(box, wrapLabel(stage.name, boxW, 12), {
        fontSize: 12,
        fill: INK,
        weight: 600,
        offsetY: -8,
      }),
    );
    parts.push(
      label(box.x + box.w / 2, box.y + box.h - 13, stage.status, {
        fontSize: 10.5,
        fill: t.text,
        anchor: 'middle',
        weight: 600,
      }),
    );
  });

  for (let i = 0; i < boxes.length - 1; i++) {
    const a = boxes[i];
    const b = boxes[i + 1];
    if (a.y === b.y) {
      parts.push(arrow(a, b, '#8A8A8A'));
    } else {
      // Wrap to the next row: exit right, drop, re-enter from the left.
      const y1 = a.y + a.h / 2;
      const y2 = b.y + b.h / 2;
      parts.push(
        `<path d="M ${a.x + a.w} ${y1} L ${W - 14} ${y1} L ${W - 14} ${
          y1 + (y2 - y1) / 2
        } L 16 ${y1 + (y2 - y1) / 2} L 16 ${y2} L ${b.x - 8} ${y2}" fill="none" stroke="#C9C4BA" stroke-width="1.5" marker-end="url(#arrowhead)" />`,
      );
    }
  }

  const mermaid = [
    'flowchart LR',
    ...active.map(
      (s, i) =>
        `  S${i}["${mmd(s.name)}<br/><i>${mmd(s.status)}</i>"]${
          i < active.length - 1 ? ` --> S${i + 1}` : ''
        }`,
    ),
  ].join('\n');

  return {
    id: 'approval-path',
    title: 'Approval path',
    purpose:
      'The review stages this adoption has to clear, in order, with current status — so the blocked stage is visible without asking around.',
    svg: svgDocument(W, H, parts.join(''), 'Approval path diagram'),
    mermaid,
  };
}

/* ------------------------------------------------------------- risk heatmap */

/**
 * Readiness across every review lens that applies, as a grid. Turns twenty rows
 * of a table into something an executive reads in one glance.
 */
export function riskHeatmap(ctx: ReportContext): Diagram {
  const teams = ctx.teams.filter((t) => t.required);
  const perRow = 5;
  const cell = 148;
  const cellH = 78;
  const gap = 12;
  const W = 30 * 2 + perRow * cell + (perRow - 1) * gap;
  const rows = Math.max(1, Math.ceil(teams.length / perRow));
  const H = 30 * 2 + rows * cellH + (rows - 1) * gap;

  const parts = teams.map((t, i) => {
    const box: Box = {
      x: 30 + (i % perRow) * (cell + gap),
      y: 30 + Math.floor(i / perRow) * (cellH + gap),
      w: cell,
      h: cellH,
    };
    const t2 = tone(t.normalized);
    return [
      rect(box, { fill: t2.fill, stroke: t2.stroke, radius: 6 }),
      centeredText(box, wrapLabel(t.lens.title, cell, 11.5), {
        fontSize: 11.5,
        fill: INK,
        weight: 600,
        offsetY: -12,
      }),
      label(box.x + box.w / 2, box.y + box.h - 16, `${t.normalized}%`, {
        fontSize: 19,
        fill: t2.text,
        anchor: 'middle',
        weight: 700,
      }),
      t.activeBlockerLabels.length
        ? label(box.x + box.w - 10, box.y + 16, '●', { fontSize: 12, fill: DANGER, anchor: 'end' })
        : '',
    ].join('');
  });

  if (teams.length === 0) {
    parts.push(
      label(30, 58, 'No review lenses are required for this scope yet.', {
        fontSize: 13,
        fill: MUTED,
        weight: 400,
      }),
    );
  }

  const mermaid = [
    'flowchart TB',
    ...teams.map((t, i) => `  L${i}["${mmd(t.lens.title)}<br/>${t.normalized}%"]`),
  ].join('\n');

  return {
    id: 'risk-heatmap',
    title: 'Readiness heatmap',
    purpose:
      'Every required review lens, coloured by readiness. A dot marks a lens with an active blocker.',
    svg: svgDocument(W, H, parts.join(''), 'Readiness heatmap'),
    mermaid,
  };
}

/* ----------------------------------------------------------- trust boundary */

/**
 * Who is accountable for what. On-premise and internal builds put the whole
 * stack on the customer; a vendor SaaS pushes most of it across the boundary —
 * and that split is exactly what a third-party risk reviewer is assessing.
 */
export function trustBoundaryDiagram(profile: Profile, score: ScoreResult): Diagram {
  const W = 800;
  const H = 300;
  const half = (W - 90) / 2;

  const ours: string[] = ['Identity & access', 'User training', 'Data classification'];
  const theirs: string[] = [];

  if (profile.selfHosted || profile.toolCategory === 'On-premise software' || profile.toolCategory === 'Internal build') {
    ours.push('Infrastructure', 'Patching & hardening', 'Application code');
  } else {
    theirs.push('Infrastructure', 'Patching & hardening', 'Application code');
  }
  if (profile.externalVendor) theirs.push('Availability & DR', 'Sub-processors');
  else ours.push('Availability & DR');
  if (profile.connectorEnabled) ours.push('Connector scope approval');

  const column = (x: number, title: string, items: string[], stroke: string, dashed: boolean) => {
    const box: Box = { x, y: 54, w: half, h: H - 90 };
    const body = items
      .slice(0, 7)
      .map((item, i) => label(x + 18, 96 + i * 22, `• ${item}`, { fontSize: 12, fill: INK, weight: 400 }))
      .join('');
    return (
      rect(box, { fill: '#FFFFFF', stroke, dashed, radius: 10 }) +
      label(x + 18, 78, title, { fontSize: 12, fill: stroke, weight: 700 }) +
      body
    );
  };

  const parts = [
    label(30, 30, 'Accountability split', { fontSize: 13, fill: INK, weight: 700 }),
    label(W - 30, 30, `${score.risk} overall risk`, {
      fontSize: 12,
      fill: MUTED,
      anchor: 'end',
      weight: 500,
    }),
    column(30, 'YOUR ORGANIZATION', ours, OK, false),
    column(30 + half + 30, (profile.platform || 'THE VENDOR').toUpperCase(), theirs.length ? theirs : ['Nothing — you run the whole stack'], DANGER, true),
  ];

  const mermaid = [
    'flowchart LR',
    '  subgraph Org["Your organization"]',
    ...ours.map((o, i) => `    O${i}["${mmd(o)}"]`),
    '  end',
    `  subgraph Vendor["${mmd(profile.platform || 'The vendor')}"]`,
    ...(theirs.length ? theirs : ['You run the whole stack']).map((t, i) => `    V${i}["${mmd(t)}"]`),
    '  end',
  ].join('\n');

  return {
    id: 'trust-boundary',
    title: 'Trust boundary',
    purpose:
      'Which controls your organization owns and which sit with the vendor — the split a third-party risk reviewer has to sign off on.',
    svg: svgDocument(W, H, parts.join(''), 'Trust boundary diagram'),
    mermaid,
  };
}

/* ------------------------------------------------------------------ bundling */

/** Mermaid label text: quotes and pipes break the node syntax. */
function mmd(text: string): string {
  return String(text ?? '').replace(/["|<>]/g, ' ').trim();
}

export function buildDiagrams(ctx: ReportContext, stages: WorkflowStage[]): Diagram[] {
  return [
    dataFlowDiagram(ctx.profile, ctx.brand),
    trustBoundaryDiagram(ctx.profile, ctx.score),
    approvalPathDiagram(stages),
    riskHeatmap(ctx),
  ];
}

export { esc };

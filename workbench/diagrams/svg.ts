/**
 * A very small SVG layout kit, deliberately not a graph library.
 *
 * The diagrams this product generates are fixed shapes — a left-to-right data
 * flow, a stage chain, a readiness grid — so a layout engine would be more
 * machinery than the job needs. Column and grid placement is arithmetic, and
 * keeping it here means diagrams render identically in the app, in the printable
 * export, and in a test, with no runtime dependency and nothing to load.
 */

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Break a label onto at most `maxLines` lines that fit `width`, using an
 * average glyph width. Approximate on purpose: exact text metrics need a DOM,
 * and these diagrams have to render on the server too.
 */
export function wrapLabel(text: string, width: number, fontSize: number, maxLines = 2): string[] {
  const perChar = fontSize * 0.55;
  const maxChars = Math.max(6, Math.floor((width - 16) / perChar));
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);

  if (lines.length === 0) return [text.slice(0, maxChars)];
  // Anything that didn't fit is elided rather than silently dropped, so a long
  // tool name reads as truncated instead of renamed.
  const consumed = lines.join(' ');
  if (consumed.length < text.length - 1) {
    lines[lines.length - 1] = lines[lines.length - 1].slice(0, Math.max(1, maxChars - 1)) + '…';
  }
  return lines;
}

export function rect(
  box: Box,
  opts: { fill: string; stroke: string; radius?: number; dashed?: boolean; strokeWidth?: number },
): string {
  const dash = opts.dashed ? ' stroke-dasharray="6 5"' : '';
  return `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="${
    opts.radius ?? 8
  }" fill="${esc(opts.fill)}" stroke="${esc(opts.stroke)}" stroke-width="${
    opts.strokeWidth ?? 1.5
  }"${dash} />`;
}

export function centeredText(
  box: Box,
  lines: string[],
  opts: { fontSize: number; fill: string; weight?: number; offsetY?: number },
): string {
  const lh = opts.fontSize * 1.25;
  const start = box.y + box.h / 2 - ((lines.length - 1) * lh) / 2 + opts.fontSize * 0.35 + (opts.offsetY ?? 0);
  return lines
    .map(
      (line, i) =>
        `<text x="${box.x + box.w / 2}" y="${start + i * lh}" text-anchor="middle" font-size="${
          opts.fontSize
        }" font-weight="${opts.weight ?? 500}" fill="${esc(opts.fill)}">${esc(line)}</text>`,
    )
    .join('');
}

export function label(
  x: number,
  y: number,
  text: string,
  opts: { fontSize: number; fill: string; weight?: number; anchor?: string },
): string {
  return `<text x="${x}" y="${y}" text-anchor="${opts.anchor ?? 'start'}" font-size="${
    opts.fontSize
  }" font-weight="${opts.weight ?? 500}" fill="${esc(opts.fill)}">${esc(text)}</text>`;
}

/** Horizontal arrow from the right edge of `from` to the left edge of `to`. */
export function arrow(from: Box, to: Box, stroke: string, text?: string): string {
  const x1 = from.x + from.w;
  const x2 = to.x;
  const y1 = from.y + from.h / 2;
  const y2 = to.y + to.h / 2;
  const midX = (x1 + x2) / 2;
  const path =
    y1 === y2
      ? `M ${x1} ${y1} L ${x2 - 8} ${y2}`
      : `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2 - 8} ${y2}`;
  const caption = text
    ? `<text x="${midX}" y="${(y1 + y2) / 2 - 6}" text-anchor="middle" font-size="10" fill="${esc(
        stroke,
      )}">${esc(text)}</text>`
    : '';
  return `<path d="${path}" fill="none" stroke="${esc(
    stroke,
  )}" stroke-width="1.5" marker-end="url(#arrowhead)" />${caption}`;
}

export const ARROWHEAD_DEF = `
<defs>
  <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7"
    orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="#8A8A8A" />
  </marker>
</defs>`.trim();

export function svgDocument(
  width: number,
  height: number,
  body: string,
  title: string,
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="${esc(
    title,
  )}" style="max-width:${width}px;height:auto"><title>${esc(
    title,
  )}</title>${ARROWHEAD_DEF}${body}</svg>`;
}

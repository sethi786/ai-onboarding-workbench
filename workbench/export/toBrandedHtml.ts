import type { ReportContext } from './reportContext';
import type { DocumentBrand } from '../types';
import { DRAFT_BANNER, DISCLAIMER } from '../data/constants';

/**
 * A self-contained, printable review document carrying the workspace's own
 * branding.
 *
 * Markdown exports are fine for pasting into a ticket, but the artifacts that
 * actually move an approval forward — the pack that goes to a risk committee or
 * back to a customer's security team — have to look like a document from that
 * organization. This builds one: cover page, colour, logo, handling marking,
 * page-numbered print CSS. Everything is inlined so the file works offline and
 * "Print → Save as PDF" produces the finished artifact with no server round
 * trip and no PDF dependency.
 */

export interface BrandedHtmlSection {
  /** Heading rendered above the block. */
  title: string;
  /** Pre-rendered, already-escaped HTML — used for inline SVG diagrams. */
  html?: string;
  /** Plain paragraphs; escaped on the way in. */
  paragraphs?: string[];
}

export interface BrandedHtmlOptions {
  title?: string;
  /** Extra sections appended after the standard body (diagrams, AI narrative). */
  sections?: BrandedHtmlSection[];
  /** Product attribution line. Omit to leave the document unattributed. */
  producedWith?: string;
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape for HTML text and attribute contexts. */
export function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

function riskClass(risk: string): string {
  const r = risk.toLowerCase();
  if (r.includes('critical') || r.includes('high')) return 'pill pill-danger';
  if (r.includes('medium') || r.includes('moderate')) return 'pill pill-warn';
  return 'pill pill-ok';
}

/** Readiness ring, drawn as inline SVG so it survives PDF export. */
function gauge(value: number, color: string): string {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, value)) / 100) * circumference;
  return `
<svg viewBox="0 0 128 128" width="128" height="128" role="img" aria-label="Readiness ${esc(value)} out of 100">
  <circle cx="64" cy="64" r="${r}" fill="none" stroke="#E6E2DA" stroke-width="12" />
  <circle cx="64" cy="64" r="${r}" fill="none" stroke="${esc(color)}" stroke-width="12"
    stroke-linecap="round" stroke-dasharray="${filled.toFixed(2)} ${circumference.toFixed(2)}"
    transform="rotate(-90 64 64)" />
  <text x="64" y="60" text-anchor="middle" font-size="30" font-weight="600" fill="#1A1A1A">${esc(value)}</text>
  <text x="64" y="80" text-anchor="middle" font-size="11" fill="#6B6B6B">READINESS</text>
</svg>`.trim();
}

function coverPage(ctx: ReportContext, brand: DocumentBrand, title: string): string {
  const p = ctx.profile;
  return `
<section class="cover">
  <header class="cover-head">
    ${brand.logoUrl ? `<img class="logo" src="${esc(brand.logoUrl)}" alt="${esc(brand.organizationName)}" />` : ''}
    <div class="org">${esc(brand.organizationName)}</div>
  </header>
  <div class="cover-body">
    <div class="marking">${esc(brand.confidentialityLabel)}</div>
    <h1>${esc(title)}</h1>
    <p class="subject">${esc(p.name)}</p>
    <dl class="cover-meta">
      <div><dt>Platform</dt><dd>${esc(p.platform || '—')}</dd></div>
      <div><dt>Category</dt><dd>${esc(p.toolCategory)}</dd></div>
      <div><dt>Environment</dt><dd>${esc(p.environment)}</dd></div>
      <div><dt>Data classification</dt><dd>${esc(p.dataClassification)}</dd></div>
      <div><dt>Business owner</dt><dd>${esc(p.businessOwner || '—')}</dd></div>
      <div><dt>Technical owner</dt><dd>${esc(p.technicalOwner || '—')}</dd></div>
      <div><dt>Generated</dt><dd>${esc(ctx.generatedAt)}</dd></div>
    </dl>
  </div>
  <p class="draft">${esc(DRAFT_BANNER)}</p>
</section>`.trim();
}

function summarySection(ctx: ReportContext, brand: DocumentBrand): string {
  const s = ctx.score;
  return `
<section class="page">
  <h2>Decision summary</h2>
  <div class="summary">
    ${gauge(s.readiness, brand.primaryColor)}
    <dl class="stats">
      <div><dt>Recommendation</dt><dd class="strong">${esc(s.recommendation)}</dd></div>
      <div><dt>Overall risk</dt><dd><span class="${riskClass(s.risk)}">${esc(s.risk)}</span></dd></div>
      <div><dt>Approval status</dt><dd>${esc(s.approvalStatus)}</dd></div>
      <div><dt>Evidence complete</dt><dd>${esc(s.evidenceCompleteness)}%</dd></div>
      <div><dt>Active blockers</dt><dd>${esc(s.blockersCount)}</dd></div>
      <div><dt>Reviews signed off</dt><dd>${esc(s.teamsSignedOff)} of ${esc(s.requiredTeams)}</dd></div>
      ${
        s.certification && s.certification.state !== 'not-certified'
          ? `<div><dt>Clearance</dt><dd>${
              s.certification.state === 'expired'
                ? `<span class="pill pill-danger">Expired</span>`
                : `${esc(s.certification.daysRemaining)} days remaining`
            }</dd></div>`
          : ''
      }
      <div><dt>Reviews started</dt><dd>${esc(s.requiredTeams - s.teamsNotStarted)} of ${esc(s.requiredTeams)}${
        s.teamsNotStarted > 0
          ? ` <span class="muted">— readiness covers the ${esc(s.requiredTeams - s.teamsNotStarted)} reviewed</span>`
          : ''
      }</dd></div>
    </dl>
  </div>
</section>`.trim();
}

function teamsTable(ctx: ReportContext): string {
  const rows = ctx.teams
    .filter((t) => t.required)
    .map(
      (t) => `
      <tr>
        <td>${esc(t.lens.title)}</td>
        <td class="num">${esc(t.normalized)}%</td>
        <td class="num">${esc(t.controlsComplete)}/${esc(t.controlsTotal)}</td>
        <td class="num">${esc(t.evidenceComplete)}/${esc(t.evidenceTotal)}</td>
        <td>${esc(t.assessment.decision)}</td>
        <td class="num">${t.activeBlockerLabels.length ? `<span class="pill pill-danger">${t.activeBlockerLabels.length}</span>` : '0'}</td>
      </tr>`,
    )
    .join('');

  return `
<section class="page">
  <h2>Review status by team</h2>
  <p class="note">Only the review lenses that apply to this tool are listed. Lenses excluded by
  scope — for example AI engineering review on a tool with no AI capability — are not shown.</p>
  <table>
    <thead>
      <tr><th>Review team</th><th class="num">Readiness</th><th class="num">Controls</th>
      <th class="num">Evidence</th><th>Decision</th><th class="num">Blockers</th></tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="6">No required reviews for this scope.</td></tr>'}</tbody>
  </table>
</section>`.trim();
}

function findingsSection(ctx: ReportContext): string {
  const blocked = ctx.teams.filter((t) => t.required && t.activeBlockerLabels.length > 0);
  const gaps = ctx.teams.filter((t) => t.required && t.missingEvidence.length > 0);

  const list = (items: string[]) =>
    items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : '';

  return `
<section class="page">
  <h2>Blocking items</h2>
  ${
    blocked.length
      ? blocked
          .map(
            (t) => `<h3>${esc(t.lens.title)}</h3>${list(t.activeBlockerLabels)}`,
          )
          .join('')
      : '<p class="ok">No active blockers on required reviews.</p>'
  }

  <h2>Outstanding evidence</h2>
  ${
    gaps.length
      ? gaps.map((t) => `<h3>${esc(t.lens.title)}</h3>${list(t.missingEvidence)}`).join('')
      : '<p class="ok">All required evidence has been marked complete.</p>'
  }
</section>`.trim();
}

function extraSections(sections: BrandedHtmlSection[]): string {
  if (!sections.length) return '';
  return sections
    .map(
      (s) => `
<section class="page">
  <h2>${esc(s.title)}</h2>
  ${(s.paragraphs ?? []).map((p) => `<p>${esc(p)}</p>`).join('')}
  ${s.html ?? ''}
</section>`,
    )
    .join('');
}

export function toBrandedHtml(
  ctx: ReportContext,
  brand: DocumentBrand,
  options: BrandedHtmlOptions = {},
): string {
  const title = options.title ?? 'Tool Adoption Review';
  const accent = brand.primaryColor;
  const footerBits = [
    brand.documentFooter,
    brand.confidentialityLabel,
    options.producedWith,
  ].filter(Boolean);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)} — ${esc(ctx.profile.name)}</title>
<style>
  :root { --accent: ${esc(accent)}; }
  * { box-sizing: border-box; }
  body {
    margin: 0; color: #1A1A1A; background: #F4F2EE;
    font: 15px/1.55 ui-sans-serif, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
  }
  .doc { max-width: 820px; margin: 0 auto; background: #fff; }
  section { padding: 44px 56px; }
  .cover { min-height: 92vh; display: flex; flex-direction: column;
           border-top: 10px solid var(--accent); }
  .cover-head { display: flex; align-items: center; gap: 14px; }
  .logo { max-height: 44px; max-width: 220px; object-fit: contain; }
  .org { font-weight: 600; letter-spacing: .01em; }
  .cover-body { margin-top: auto; margin-bottom: auto; }
  .marking { font-size: 11px; letter-spacing: .14em; text-transform: uppercase;
             color: var(--accent); font-weight: 700; }
  h1 { font-size: 40px; line-height: 1.1; margin: 14px 0 6px; letter-spacing: -0.02em; }
  .subject { font-size: 19px; color: #4A4A4A; margin: 0 0 30px; }
  .cover-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 32px; margin: 0; }
  .cover-meta div { border-top: 1px solid #E6E2DA; padding-top: 8px; }
  dt { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #7A7A7A; }
  dd { margin: 2px 0 0; font-weight: 500; }
  .draft { margin: 0; font-size: 12px; color: #7A7A7A; border-top: 1px solid #E6E2DA;
           padding-top: 14px; }
  h2 { font-size: 22px; letter-spacing: -0.01em; margin: 0 0 16px;
       padding-bottom: 8px; border-bottom: 2px solid var(--accent); }
  h3 { font-size: 15px; margin: 20px 0 6px; }
  .note { color: #6B6B6B; font-size: 13px; margin-top: -8px; }
  .muted { color: #7A7A7A; font-weight: 400; }
  .summary { display: flex; gap: 34px; align-items: center; flex-wrap: wrap; }
  .stats { flex: 1; min-width: 260px; display: grid; grid-template-columns: 1fr 1fr;
           gap: 14px 24px; margin: 0; }
  .stats div { border-top: 1px solid #E6E2DA; padding-top: 8px; }
  .strong { font-weight: 700; color: var(--accent); }
  .pill { display: inline-block; padding: 2px 9px; border-radius: 999px;
          font-size: 12px; font-weight: 600; }
  .pill-ok { background: #E7F2EC; color: #1D5C43; }
  .pill-warn { background: #FBF0DA; color: #7A5312; }
  .pill-danger { background: #FBE4E2; color: #8C2018; }
  .ok { color: #1D5C43; }
  table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  th, td { text-align: left; padding: 9px 10px; border-bottom: 1px solid #E6E2DA; }
  th { font-size: 11px; text-transform: uppercase; letter-spacing: .07em; color: #7A7A7A; }
  .num { text-align: right; }
  ul { margin: 6px 0 0; padding-left: 20px; }
  li { margin: 3px 0; }
  footer { padding: 20px 56px 44px; font-size: 11px; color: #7A7A7A;
           border-top: 1px solid #E6E2DA; }
  svg { flex-shrink: 0; }

  @media print {
    body { background: #fff; }
    .doc { max-width: none; }
    section { padding: 26px 0; }
    .cover { min-height: 88vh; page-break-after: always; }
    .page { page-break-inside: avoid; }
    h2 { page-break-after: avoid; }
    tr { page-break-inside: avoid; }
    @page { margin: 18mm 16mm; }
  }
</style>
</head>
<body>
<div class="doc">
  ${coverPage(ctx, brand, title)}
  ${summarySection(ctx, brand)}
  ${teamsTable(ctx)}
  ${findingsSection(ctx)}
  ${extraSections(options.sections ?? [])}
  <footer>
    ${footerBits.map((b) => `<div>${esc(b)}</div>`).join('')}
    <div>${esc(DISCLAIMER)}</div>
  </footer>
</div>
</body>
</html>`;
}

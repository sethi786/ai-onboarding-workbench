import { ImageResponse } from 'next/og';
import { TOOL_PAGES, TOOL_PAGE_BY_SLUG } from '@/lib/tool-pages';

/**
 * Per-tool share card.
 *
 * A tool page gets pasted into exactly the conversation where the numbers
 * matter — "here's what a Copilot review actually involves" — so the card
 * carries them rather than a generic tagline.
 */
export const alt = 'Tool adoption review';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return TOOL_PAGES.map((t) => ({ slug: t.slug }));
}

const INK = '#2B2A26';
const PAPER = '#FBFAF7';
const EVERGREEN = '#1F5F4E';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = TOOL_PAGE_BY_SLUG[slug];

  // Satori treats each interpolation as a separate child node and rejects any
  // element with more than one unless it declares display:flex. Precomputing
  // the strings keeps every text element to a single child.
  const eyebrow = `${(t?.vendor ?? 'Aegis').toUpperCase()} · ADOPTION REVIEW`;
  const headline = `What a ${t?.name ?? 'tool'} review has to clear`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: PAPER,
          padding: '68px 76px',
          borderTop: `16px solid ${EVERGREEN}`,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '0.16em',
              color: EVERGREEN,
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 600,
              color: INK,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              maxWidth: 980,
            }}
          >
            {headline}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          {[
            { n: String(t?.lenses.length ?? 0), l: 'reviews apply' },
            { n: String(t?.totalControls ?? 0), l: 'controls' },
            { n: t?.depth ?? 'Standard', l: 'depth' },
            { n: t?.risk ?? 'Medium', l: 'risk grade' },
          ].map((s) => (
            <div
              key={s.l}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                borderTop: '3px solid #E2DED4',
                paddingTop: 16,
              }}
            >
              <div style={{ fontSize: 52, fontWeight: 600, color: INK, letterSpacing: '-0.02em' }}>
                {s.n}
              </div>
              <div style={{ fontSize: 22, color: '#6B6862', marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', fontSize: 24, color: '#6B6862' }}>
          aegis · free for your first tool
        </div>
      </div>
    ),
    size,
  );
}

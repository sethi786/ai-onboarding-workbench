import { ImageResponse } from 'next/og';
import { SITE } from '@/lib/site';

/**
 * The card a shared Aegis link renders as.
 *
 * This product spreads through internal champions pasting links into Slack and
 * Teams. Without an image those all render as bare grey text, which is a poor
 * showing for a tool whose pitch is that it makes governance look professional.
 *
 * Drawn rather than uploaded so it stays in sync with the brand and needs no
 * binary in the repo.
 */
export const runtime = 'edge';
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const INK = '#2B2A26';
const PAPER = '#FBFAF7';
const EVERGREEN = '#1F5F4E';

// Satori rejects an element with multiple children unless it declares
// display:flex, and every interpolation counts as one — so text stays whole.
const SUBTITLE =
  'Security, privacy, legal, and risk review as one readiness workflow — scoped to what you’re actually adopting.';

export default function Image() {
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
          padding: '72px 80px',
          borderTop: `16px solid ${EVERGREEN}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: EVERGREEN,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: PAPER,
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            A
          </div>
          <div style={{ fontSize: 30, fontWeight: 600, color: INK }}>{SITE.name}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              fontSize: 74,
              fontWeight: 600,
              color: INK,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              maxWidth: 900,
            }}
          >
            Adopt any tool, already cleared.
          </div>
          <div style={{ fontSize: 30, color: '#6B6862', maxWidth: 860, lineHeight: 1.35 }}>
            {SUBTITLE}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 40, fontSize: 22, color: '#6B6862' }}>
          <div>20 review lenses</div>
          <div>SaaS · Cloud · On-prem · AI</div>
          <div>Free for your first tool</div>
        </div>
      </div>
    ),
    size,
  );
}

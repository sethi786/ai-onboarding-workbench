import { DEMO_DOCUMENT_HTML } from '@/lib/demo-review';

/**
 * The published example review document, served as its own HTML page.
 *
 * It's a complete standalone document — its own print CSS, its own cover page,
 * inline SVG diagrams — so it can't be rendered inside the marketing layout.
 * Serving it here lets the example page frame it and lets a visitor open,
 * print, or save it exactly as a customer would.
 */
export const dynamic = 'force-static';

export function GET() {
  return new Response(DEMO_DOCUMENT_HTML, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Public, immutable-per-build marketing content.
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

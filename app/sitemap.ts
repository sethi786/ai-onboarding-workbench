import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';
import { PROBLEMS } from '@/lib/problems';
import { SOLUTIONS } from '@/lib/solutions';
import { GUIDES } from '@/lib/guides';
import { TOOL_PAGES } from '@/lib/tool-pages';

/**
 * Every public URL, generated from the same data that renders the pages.
 *
 * Hand-maintained sitemaps rot: a route gets added, the sitemap doesn't, and
 * the page is invisible to search for as long as nobody notices. Deriving it
 * means a new use case or tool template is crawlable the moment it exists.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url.replace(/\/$/, '');
  const entry = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${base}${path}`,
    changeFrequency: 'weekly',
    priority,
  });

  return [
    entry('', 1),
    entry('/platform', 0.9),
    entry('/pricing', 0.9),
    // Tool pages answer the highest-intent query this product gets — someone
    // typing "<tool> security review" long before they've heard of us.
    entry('/tools', 0.9),
    ...TOOL_PAGES.map((t) => entry(`/tools/${t.slug}`, 0.8)),
    // The Act's high-risk obligations land in August 2026; this is the most
    // time-sensitive query the site can rank for.
    entry('/eu-ai-act', 0.9),
    entry('/use-cases', 0.8),
    ...PROBLEMS.map((p) => entry(`/use-cases/${p.slug}`, 0.7)),
    entry('/solutions', 0.8),
    ...SOLUTIONS.map((s) => entry(`/solutions/${s.slug}`, 0.7)),
    entry('/resources', 0.8),
    ...GUIDES.map((g) => entry(`/resources/${g.slug}`, 0.7)),
    entry('/why-aegis', 0.7),
    entry('/assessment', 0.6),
    entry('/security', 0.6),
    entry('/about', 0.5),
    entry('/contact', 0.5),
    entry('/book', 0.5),
    entry('/privacy', 0.3),
    entry('/terms', 0.3),
  ];
}

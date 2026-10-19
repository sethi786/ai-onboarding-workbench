import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';
import { TOOL_TEMPLATES } from '@/data/tool-templates';
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    '',
    '/pricing',
    '/demo',
    '/tools',
    '/assessments',
    '/platform',
    '/security',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    ...TOOL_TEMPLATES.map((t) => `/tools/${t.id}`),
  ].map((path) => ({
    url: `${SITE.url}${path}`,
    changeFrequency: 'monthly',
    priority: path === '' ? 1 : 0.7,
  }));
}

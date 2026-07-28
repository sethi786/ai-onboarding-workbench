import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const base = SITE.url.replace(/\/$/, '');
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The portal is tenant data behind auth. Crawlers get redirected to the
      // login page anyway, but saying so keeps those redirects out of the
      // crawl budget and out of search results.
      disallow: ['/portal/', '/auth/', '/invite/'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}

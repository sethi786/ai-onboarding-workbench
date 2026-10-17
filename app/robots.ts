import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';
export default function robots(): MetadataRoute.Robots {
  const live =
    process.env.LAUNCH_APPROVED === 'true' &&
    process.env.VERCEL_ENV !== 'preview';
  return {
    rules: {
      userAgent: '*',
      allow: live ? '/' : undefined,
      disallow: live
        ? [
            '/portal/',
            '/admin',
            '/auth/',
            '/api/',
            '/invite/',
            '/login',
            '/signup',
            '/reset-password',
            '/forgot-password',
            '/resend-confirmation',
          ]
        : '/',
    },
    ...(live ? { sitemap: `${SITE.url}/sitemap.xml` } : {}),
  };
}

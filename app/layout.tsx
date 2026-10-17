import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Toaster } from 'sonner';
import './globals.css';
import { SITE } from '@/lib/site';
import { MotionPreferences } from '@/components/motion/MotionPreferences';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: 'website',
  },
  robots: {
    index:
      process.env.LAUNCH_APPROVED === 'true' &&
      process.env.VERCEL_ENV !== 'preview',
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <MotionPreferences>{children}</MotionPreferences>
        <Toaster
          richColors
          position="top-right"
          toastOptions={{ style: { fontFamily: 'var(--font-geist-sans)' } }}
        />
      </body>
    </html>
  );
}

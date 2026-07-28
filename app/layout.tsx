import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Instrument_Serif } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import { SITE } from '@/lib/site';

/**
 * Display face.
 *
 * Headlines were set in the same grotesk as the interface, which is the
 * house style of every site assembled by a generator — and a product whose
 * whole argument is "a person actually looked at this" cannot afford to look
 * machine-assembled. A high-contrast editorial serif reads as a considered
 * choice, carries the authority the subject matter needs, and finishes the
 * warm paper palette the rest of the site already commits to. Body and
 * interface stay in Geist, which is a good UI face; it was only ever the
 * headlines giving the game away.
 */
const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

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
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${display.variable}`}
    >
      <body>
        {children}
        <Toaster
          richColors
          position="top-right"
          toastOptions={{ style: { fontFamily: 'var(--font-geist-sans)' } }}
        />
      </body>
    </html>
  );
}

import { Hero } from '@/components/marketing/Hero';
import { LogoMarquee } from '@/components/marketing/LogoMarquee';
import { WhatYouGet } from '@/components/marketing/WhatYouGet';
import { ProblemRouter } from '@/components/marketing/ProblemRouter';
import { FeatureGrid, Pricing, FAQ, FinalCTA } from '@/components/marketing/LandingSections';

/**
 * The homepage makes four points, in this order: what this is, what it
 * produces, how it does it, and whether it's for you.
 *
 * It previously made twelve, each in its own full-height band at identical
 * volume — a statement band, a counter row, a feature grid, an interactive
 * demo, a reviewer-questions triptych, and so on down 12,500 pixels. Nothing
 * was emphasised because everything was, and a page that long with that little
 * hierarchy reads as assembled rather than authored. The material that was
 * worth keeping moved to the page it belongs on: the four-step walkthrough and
 * the reviewer questions are on /platform, and the interactive demo is
 * superseded by /scope, which does the same thing on the visitor's own tool.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <LogoMarquee />
      <WhatYouGet />
      <FeatureGrid />
      <ProblemRouter />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </>
  );
}

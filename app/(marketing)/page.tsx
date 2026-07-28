import { Hero } from '@/components/marketing/Hero';
import { LogoMarquee } from '@/components/marketing/LogoMarquee';
import { WhatYouGet } from '@/components/marketing/WhatYouGet';
import { Stats } from '@/components/marketing/Stats';
import { LiveDemo } from '@/components/marketing/LiveDemo';
import { ProblemRouter } from '@/components/marketing/ProblemRouter';
import {
  StatementBand,
  FeatureGrid,
  HowItWorks,
  Pricing,
  ReviewerQuestions,
  FAQ,
  FinalCTA,
} from '@/components/marketing/LandingSections';

export default function HomePage() {
  return (
    <>
      <Hero />
      <LogoMarquee />
      {/* Show the artifact before describing it — a visitor who scrolls once
          should see the actual output, not another claim about it. */}
      <WhatYouGet />
      <HowItWorks />
      <ProblemRouter />
      <StatementBand />
      <Stats />
      <FeatureGrid />
      <LiveDemo />
      <ReviewerQuestions />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </>
  );
}

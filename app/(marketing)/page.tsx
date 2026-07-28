import { Hero } from '@/components/marketing/Hero';
import { LogoMarquee } from '@/components/marketing/LogoMarquee';
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
      <ProblemRouter />
      <StatementBand />
      <Stats />
      <FeatureGrid />
      <HowItWorks />
      <LiveDemo />
      <ReviewerQuestions />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </>
  );
}

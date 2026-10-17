import { Hero } from '@/components/marketing/Hero';
import { LiveDemo } from '@/components/marketing/LiveDemo';
import {
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

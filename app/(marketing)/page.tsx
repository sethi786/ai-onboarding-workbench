import { Hero } from '@/components/marketing/Hero';
import { LogoMarquee } from '@/components/marketing/LogoMarquee';
import { Stats } from '@/components/marketing/Stats';
import { LiveDemo } from '@/components/marketing/LiveDemo';
import {
  FeatureGrid,
  HowItWorks,
  Pricing,
  Testimonials,
  FAQ,
  FinalCTA,
} from '@/components/marketing/LandingSections';

export default function HomePage() {
  return (
    <>
      <Hero />
      <LogoMarquee />
      <Stats />
      <LiveDemo />
      <FeatureGrid />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </>
  );
}

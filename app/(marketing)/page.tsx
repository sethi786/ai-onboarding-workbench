import { Hero } from '@/components/marketing/Hero';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import {
  FeatureGrid,
  HowItWorks,
  Pricing,
  FAQ,
  FinalCTA,
} from '@/components/marketing/LandingSections';

export default function HomePage() {
  return (
    <>
      <Hero accountsAvailable={isSupabaseConfigured()} />
      <FeatureGrid />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </>
  );
}

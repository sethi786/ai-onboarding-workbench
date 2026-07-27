import {
  Briefcase,
  Compass,
  Landmark,
  Blocks,
  ShieldCheck,
  Lock,
  Scale,
  Target,
  Database,
  KeyRound,
  Cloud,
  Wrench,
  Cpu,
  Bot,
  Cable,
  LifeBuoy,
  GraduationCap,
  Building2,
  Wallet,
  Flag,
  type LucideIcon,
} from 'lucide-react';
import type { TeamId } from '@/workbench/types';
import { cn } from '@/lib/utils';

/** Consistent, professional icon per review lens — no emoji anywhere. */
export const LENS_ICON: Record<TeamId, LucideIcon> = {
  business: Briefcase,
  'ai-enablement': Compass,
  'enterprise-architecture': Landmark,
  'solution-architecture': Blocks,
  'security-sar': ShieldCheck,
  'privacy-pia': Lock,
  legal: Scale,
  'qrm-risk': Target,
  'data-governance': Database,
  iam: KeyRound,
  'platform-cloud': Cloud,
  'secure-sdlc': Wrench,
  'ai-engineering': Cpu,
  'agent-governance': Bot,
  'connector-governance': Cable,
  operations: LifeBuoy,
  adoption: GraduationCap,
  'vendor-risk': Building2,
  finance: Wallet,
  'go-no-go': Flag,
};

export function LensIcon({ id, className }: { id: TeamId; className?: string }) {
  const Icon = LENS_ICON[id];
  return <Icon className={cn('h-4 w-4', className)} />;
}

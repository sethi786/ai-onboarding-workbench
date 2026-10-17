import {
  LayoutDashboard,
  ClipboardList,
  Boxes,
  Grid3x3,
  Settings,
  History,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { OrgRole } from '@/lib/db/types';
import { canManageOrg } from '@/lib/rbac';

export interface PortalNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Single source of truth for portal navigation (desktop sidebar + mobile drawer). */
export function portalNav(
  orgSlug: string,
  role: OrgRole = 'viewer',
): PortalNavItem[] {
  const base = `/portal/${orgSlug}`;
  return [
    { href: `${base}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `${base}/evaluations`, label: 'Evaluations', icon: ClipboardList },
    { href: `${base}/library`, label: 'Tool Library', icon: Boxes },
    { href: `${base}/matrix`, label: 'Platform Matrix', icon: Grid3x3 },
    { href: `${base}/activity`, label: 'Activity', icon: History },
    ...(canManageOrg(role)
      ? [{ href: `${base}/admin`, label: 'Administration', icon: ShieldCheck }]
      : []),
    {
      href: `${base}/settings/organization`,
      label: 'Settings',
      icon: Settings,
    },
  ];
}

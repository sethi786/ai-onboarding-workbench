import { LayoutDashboard, ClipboardList, Boxes, Grid3x3, Settings, type LucideIcon } from 'lucide-react';

export interface PortalNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Single source of truth for portal navigation (desktop sidebar + mobile drawer). */
export function portalNav(orgSlug: string): PortalNavItem[] {
  const base = `/portal/${orgSlug}`;
  return [
    { href: `${base}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `${base}/evaluations`, label: 'Evaluations', icon: ClipboardList },
    { href: `${base}/library`, label: 'Tool Library', icon: Boxes },
    { href: `${base}/matrix`, label: 'Platform Matrix', icon: Grid3x3 },
    { href: `${base}/settings/organization`, label: 'Settings', icon: Settings },
  ];
}

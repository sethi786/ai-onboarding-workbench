'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  Boxes,
  Grid3x3,
  Settings,
} from 'lucide-react';
import { ShieldLogo } from '@/components/brand/ShieldLogo';
import type { OrgRole } from '@/lib/db/types';
import { cn } from '@/lib/utils';

const icons = { LayoutDashboard, ClipboardList, Boxes, Grid3x3, Settings };

export function PortalSidebar({ orgSlug, role }: { orgSlug: string; role: OrgRole }) {
  const pathname = usePathname();
  const base = `/portal/${orgSlug}`;

  const nav: { href: string; label: string; icon: keyof typeof icons }[] = [
    { href: `${base}/dashboard`, label: 'Dashboard', icon: 'LayoutDashboard' },
    { href: `${base}/evaluations`, label: 'Evaluations', icon: 'ClipboardList' },
    { href: `${base}/library`, label: 'Tool Library', icon: 'Boxes' },
    { href: `${base}/matrix`, label: 'Platform Matrix', icon: 'Grid3x3' },
    { href: `${base}/settings/organization`, label: 'Settings', icon: 'Settings' },
  ];

  return (
    <aside className="flex flex-col border-r border-border bg-navy-deep text-slate-300 max-md:hidden">
      <div className="border-b border-white/10 px-5 py-4">
        <Link href={`${base}/dashboard`}>
          <ShieldLogo tone="light" />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {nav.map((n) => {
          const Icon = icons[n.icon];
          const active = pathname === n.href || pathname.startsWith(n.href + '/');
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-electric text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <span className="rounded-full bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-slate-400">
          {role}
        </span>
      </div>
    </aside>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { ShieldLogo } from '@/components/brand/ShieldLogo';
import type { OrgRole } from '@/lib/db/types';
import { cn } from '@/lib/utils';
import { portalNav } from './nav';

export function PortalMobileNav({
  orgSlug,
  orgName,
  role,
}: {
  orgSlug: string;
  orgName: string;
  role: OrgRole;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const nav = portalNav(orgSlug);

  return (
    <div className="md:hidden">
      <button
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative flex w-72 max-w-[80%] flex-col bg-navy-deep text-slate-300">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <ShieldLogo tone="light" />
              <button aria-label="Close" onClick={() => setOpen(false)} className="text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="border-b border-white/10 px-5 py-3">
              <div className="truncate text-sm font-medium text-white">{orgName}</div>
              <span className="font-mono text-[10px] uppercase tracking-wide text-slate-500">{role}</span>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {nav.map((n) => {
                const Icon = n.icon;
                const active = pathname === n.href || pathname.startsWith(n.href + '/');
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium',
                      active ? 'bg-electric text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}

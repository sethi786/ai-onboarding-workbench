'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function SettingsTabs({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname();
  const base = `/portal/${orgSlug}/settings`;
  const tabs = [
    { href: `${base}/organization`, label: 'Organization' },
    { href: `${base}/members`, label: 'Members' },
    { href: `${base}/billing`, label: 'Billing' },
    { href: `${base}/audit`, label: 'Audit trail' },
    { href: `${base}/assurance`, label: 'Our controls' },
  ];
  return (
    <nav className="mt-4 flex gap-1 border-b border-border">
      {tabs.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium',
              active ? 'border-electric text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

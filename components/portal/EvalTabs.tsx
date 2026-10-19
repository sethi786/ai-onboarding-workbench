'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function EvalTabs({
  orgSlug,
  evalId,
}: {
  orgSlug: string;
  evalId: string;
}) {
  const pathname = usePathname();
  const base = `/portal/${orgSlug}/evaluations/${evalId}`;
  const tabs = [
    { href: base, label: 'Overview', exact: true },
    { href: `${base}/lenses`, label: 'Self-Evaluation' },
    { href: `${base}/workflow`, label: 'Workflow' },
    { href: `${base}/approvals`, label: 'Approvals' },
    { href: `${base}/evidence`, label: 'Evidence Factory' },
    { href: `${base}/exports`, label: 'Exports' },
    { href: `${base}/edit`, label: 'Edit' },
    {
      href: `/portal/${orgSlug}/activity?evaluation=${evalId}`,
      label: 'History',
    },
  ];

  return (
    <nav
      aria-label="Evaluation sections"
      className="mt-4 flex gap-1 overflow-x-auto border-b border-border pb-px"
    >
      {tabs.map((t) => {
        const active = t.exact
          ? pathname === t.href
          : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              '-mb-px shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition-colors',
              active
                ? 'border-electric text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

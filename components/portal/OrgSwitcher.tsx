'use client';

import { useRouter } from 'next/navigation';
import { Building2, ChevronsUpDown } from 'lucide-react';

export function OrgSwitcher({
  orgs,
  activeSlug,
}: {
  orgs: { slug: string; name: string }[];
  activeSlug: string;
}) {
  const router = useRouter();

  return (
    <div className="relative inline-flex items-center">
      <Building2 className="pointer-events-none absolute left-2.5 h-4 w-4 text-muted-foreground" />
      <ChevronsUpDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted-foreground" />
      <select
        aria-label="Switch organization"
        value={activeSlug}
        onChange={(e) => {
          if (e.target.value === '__new__') router.push('/portal/onboarding');
          else router.push(`/portal/${e.target.value}/dashboard`);
        }}
        className="h-9 w-[150px] appearance-none truncate rounded-md border border-border bg-background pl-8 pr-7 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring sm:w-[220px]"
      >
        {orgs.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.name}
          </option>
        ))}
        <option value="__new__">+ New workspace…</option>
      </select>
    </div>
  );
}

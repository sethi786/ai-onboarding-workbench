'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { OrgSwitcher } from './OrgSwitcher';

export function PortalHeader({
  orgs,
  activeSlug,
  userEmail,
}: {
  orgs: { slug: string; name: string }[];
  activeSlug: string;
  userEmail: string;
}) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-6 backdrop-blur">
      <OrgSwitcher orgs={orgs} activeSlug={activeSlug} />
      <div className="flex-1" />
      <span className="hidden text-sm text-muted-foreground sm:inline">{userEmail}</span>
      <form action="/auth/signout" method="post" onSubmit={() => setTimeout(() => router.refresh(), 300)}>
        <button
          type="submit"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </form>
    </header>
  );
}

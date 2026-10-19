'use client';

import Link from 'next/link';
import { LogOut, CircleUserRound } from 'lucide-react';
import { OrgSwitcher } from './OrgSwitcher';
import { PortalMobileNav } from './PortalMobileNav';
import type { OrgRole } from '@/lib/db/types';

export function PortalHeader({
  orgs,
  activeSlug,
  orgName,
  role,
  userEmail,
}: {
  orgs: { slug: string; name: string }[];
  activeSlug: string;
  orgName: string;
  role: OrgRole;
  userEmail: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-4 backdrop-blur sm:gap-3 sm:px-6">
      <PortalMobileNav orgSlug={activeSlug} orgName={orgName} role={role} />
      <OrgSwitcher orgs={orgs} activeSlug={activeSlug} />
      <div className="flex-1" />
      <Link
        href="/portal/account"
        aria-label="Your account"
        className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md px-2 text-sm text-muted-foreground hover:bg-muted"
      >
        <CircleUserRound className="h-4 w-4 shrink-0" />
        <span className="hidden max-w-52 truncate md:inline">{userEmail}</span>
      </Link>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          aria-label="Sign out"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted sm:px-3"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </form>
    </header>
  );
}

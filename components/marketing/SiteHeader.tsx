'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { ShieldLogo } from '@/components/brand/ShieldLogo';
import { MARKETING_NAV } from '@/lib/site';

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-paper/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="Aegis home" onClick={() => setOpen(false)}>
          <ShieldLogo />
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {MARKETING_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-[13.5px] font-medium text-paper transition-transform hover:scale-[1.03] active:scale-100"
          >
            Start free
          </Link>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-paper md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-5 py-2">
            {MARKETING_NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-[15px] font-medium text-foreground hover:bg-muted"
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-3 text-[15px] font-medium text-muted-foreground hover:bg-muted"
            >
              Log in
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

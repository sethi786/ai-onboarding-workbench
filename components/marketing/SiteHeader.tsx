'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';
import { ShieldLogo } from '@/components/brand/ShieldLogo';
import { MEGA_NAV, type NavItem } from '@/lib/site';

export function SiteHeader() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  return (
    <header
      className="sticky top-0 z-50 border-b border-border/70 bg-paper/80 backdrop-blur-xl backdrop-saturate-150"
      onMouseLeave={() => setOpenMenu(null)}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="Aegis home" onClick={() => setMobileOpen(false)}>
          <ShieldLogo />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {MEGA_NAV.map((item) => (
            <div key={item.label} onMouseEnter={() => setOpenMenu(item.columns ? item.label : null)}>
              <Link
                href={item.href}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
                {item.columns && (
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${openMenu === item.label ? 'rotate-180' : ''}`}
                  />
                )}
              </Link>
            </div>
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground lg:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Desktop mega-menu panel */}
      {(() => {
        const active = MEGA_NAV.find((i) => i.label === openMenu && i.columns);
        if (!active) return null;
        return (
          <div className="absolute inset-x-0 top-16 hidden lg:block" onMouseLeave={() => setOpenMenu(null)}>
            <div className="mx-auto max-w-6xl px-5 sm:px-8">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-float">
                <MegaColumns item={active} onNavigate={() => setOpenMenu(null)} />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-paper lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-5 py-3">
            {MEGA_NAV.map((item) => (
              <div key={item.label} className="border-b border-border/60 last:border-0">
                {item.columns ? (
                  <>
                    <button
                      onClick={() => setMobileExpanded((e) => (e === item.label ? null : item.label))}
                      className="flex w-full items-center justify-between py-3.5 text-[15px] font-medium"
                    >
                      {item.label}
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform ${mobileExpanded === item.label ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {mobileExpanded === item.label && (
                      <div className="space-y-4 pb-4">
                        {item.columns.map((col) => (
                          <div key={col.title}>
                            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                              {col.title}
                            </div>
                            {col.links.map((l) => (
                              <Link
                                key={l.href}
                                href={l.href}
                                onClick={() => setMobileOpen(false)}
                                className="block rounded-lg px-2 py-2 text-[14.5px] font-medium text-foreground hover:bg-muted"
                              >
                                {l.label}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-3.5 text-[15px] font-medium"
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="py-3.5 text-[15px] font-medium text-muted-foreground"
            >
              Log in
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function MegaColumns({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  return (
    <div className={`grid gap-6 ${item.columns!.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
      {item.columns!.map((col) => (
        <div key={col.title}>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            {col.title}
          </div>
          <ul className={item.columns!.length === 1 ? 'grid grid-cols-2 gap-1' : 'space-y-1'}>
            {col.links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={onNavigate}
                  className="group block rounded-lg px-3 py-2 transition-colors hover:bg-muted"
                >
                  <div className="text-[14px] font-medium text-foreground">{l.label}</div>
                  {l.desc && <div className="text-[12.5px] text-muted-foreground">{l.desc}</div>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

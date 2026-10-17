'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, X } from 'lucide-react';
import { ShieldLogo } from '@/components/brand/ShieldLogo';

const NAV = [
  {
    label: 'Product',
    links: [
      {
        href: '/platform',
        label: 'Platform overview',
        detail: 'From tool intake to review readiness',
      },
      {
        href: '/demo',
        label: 'Interactive demo',
        detail: 'Try the scoring engine without an account',
      },
      {
        href: '/assessment',
        label: 'The 20 review lenses',
        detail: 'Security, privacy, legal, risk, and more',
      },
      {
        href: '/solutions',
        label: 'Solutions for your team',
        detail: 'Find the review workflow that fits',
      },
    ],
  },
  {
    label: 'Catalogue',
    links: [
      {
        href: '/tools',
        label: 'Explore AI tools',
        detail: '40 starting points for your inventory',
      },
      {
        href: '/assessments',
        label: 'Assessment starters',
        detail: 'Six scenarios, ready to scope',
      },
      {
        href: '/use-cases',
        label: 'Use cases',
        detail: 'Start with the decision you need to make',
      },
    ],
  },
  {
    label: 'Resources',
    links: [
      {
        href: '/resources',
        label: 'Guides',
        detail: 'Practical governance reference material',
      },
      {
        href: '/security',
        label: 'Security and trust',
        detail: 'Controls, boundaries, and data handling',
      },
      {
        href: '/about',
        label: 'About Aegis',
        detail: 'Why we built this workspace',
      },
      {
        href: '/contact',
        label: 'Contact',
        detail: 'Discuss your team’s requirements',
      },
    ],
  },
];

export function SiteHeader() {
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const header = useRef<HTMLElement>(null);
  const mobileToggle = useRef<HTMLButtonElement>(null);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const pathname = usePathname();
  useEffect(() => {
    setOpen(null);
    setMobile(false);
  }, [pathname]);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !header.current?.contains(event.target)
      ) {
        setOpen(null);
        setMobile(false);
      }
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  const close = () => {
    setOpen(null);
    setMobile(false);
  };
  return (
    <header
      ref={header}
      className="sticky top-0 z-50 border-b border-border/70 bg-paper/95 backdrop-blur-xl"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          if (mobile) {
            setMobile(false);
            mobileToggle.current?.focus();
          } else if (open) triggers.current[open]?.focus();
          setOpen(null);
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          close();
      }}
    >
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" aria-label="Aegis home" onClick={close}>
          <ShieldLogo />
        </Link>
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 lg:flex"
        >
          {NAV.map((item, i) => (
            <div className="relative" key={item.label}>
              <button
                ref={(node) => {
                  triggers.current[item.label] = node;
                }}
                aria-expanded={open === item.label}
                aria-controls={`nav-panel-${i}`}
                onClick={() => setOpen(open === item.label ? null : item.label)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium hover:bg-muted"
              >
                {item.label}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${open === item.label ? 'rotate-180' : ''}`}
                />
              </button>
              <div
                id={`nav-panel-${i}`}
                hidden={open !== item.label}
                className="absolute left-0 top-full w-80 pt-3"
              >
                <ul className="rounded-xl border border-border bg-card p-2 shadow-float">
                  {item.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={close}
                        className="block rounded-lg p-3 hover:bg-muted"
                      >
                        <span className="block text-sm font-medium">
                          {link.label}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {link.detail}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
          <Link
            href="/pricing"
            aria-current={pathname === '/pricing' ? 'page' : undefined}
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium hover:bg-muted"
          >
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/login"
            className="hidden min-h-11 items-center text-sm font-medium sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-sm font-medium text-paper sm:px-5"
          >
            Start free
            <span className="ml-2 hidden sm:inline" aria-hidden>
              ↗
            </span>
          </Link>
          <button
            ref={mobileToggle}
            aria-label={mobile ? 'Close menu' : 'Open menu'}
            aria-expanded={mobile}
            aria-controls="mobile-site-nav"
            onClick={() => setMobile(!mobile)}
            className="grid h-11 w-11 place-items-center rounded-full border lg:hidden"
          >
            {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <nav
        id="mobile-site-nav"
        aria-label="Mobile navigation"
        hidden={!mobile}
        className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t bg-paper px-5 py-4 lg:hidden"
      >
        {NAV.map((item) => (
          <div key={item.label} className="border-b py-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {item.label}
            </p>
            {item.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="flex min-h-11 items-center rounded-lg px-2 text-sm hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
        <Link
          href="/pricing"
          onClick={close}
          className="flex min-h-12 items-center text-sm font-medium"
        >
          Pricing
        </Link>
        <Link
          href="/login"
          onClick={close}
          className="flex min-h-12 items-center text-sm font-medium"
        >
          Log in to your workspace
        </Link>
      </nav>
    </header>
  );
}

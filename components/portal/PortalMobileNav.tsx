'use client';

import { useEffect, useRef, useState } from 'react';
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
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    const element = dialog.current;
    if (open && !element?.open) element?.showModal();
    if (!open && element?.open) element.close();
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  return (
    <div className="md:hidden">
      <button
        ref={trigger}
        aria-label="Open navigation"
        aria-expanded={open}
        aria-controls="workspace-mobile-nav"
        onClick={() => setOpen(true)}
        className="grid h-11 w-11 place-items-center rounded-lg border"
      >
        <Menu className="h-5 w-5" />
      </button>
      <dialog
        ref={dialog}
        id="workspace-mobile-nav"
        aria-label="Workspace navigation"
        onCancel={() => setOpen(false)}
        onClose={() => {
          setOpen(false);
          trigger.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        className="m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-black/50"
      >
        <div className="flex h-full w-80 max-w-[85%] flex-col overflow-y-auto bg-ink text-white/75">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <ShieldLogo tone="light" />
            <button
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
              className="grid h-11 w-11 place-items-center rounded-lg hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="border-b border-white/10 px-5 py-4">
            <p className="break-words text-sm font-medium text-white">
              {orgName}
            </p>
            <p className="mt-1 text-xs capitalize text-white/50">{role}</p>
          </div>
          <nav aria-label="Workspace" className="space-y-1 p-3">
            {portalNav(orgSlug, role).map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium',
                    active
                      ? 'bg-electric text-white'
                      : 'hover:bg-white/5 hover:text-white',
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-white/10 p-5">
            <Link
              href="/resources"
              className="inline-flex min-h-11 items-center text-sm"
            >
              Help and guides
            </Link>
          </div>
        </div>
      </dialog>
    </div>
  );
}

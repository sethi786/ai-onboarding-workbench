import Link from 'next/link';
import { ShieldLogo } from '@/components/brand/ShieldLogo';

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-slate-300 transition-colors hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-navy-deep text-slate-300">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-1">
            <ShieldLogo tone="light" />
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Enterprise AI onboarding readiness — governance, security, and go/no-go evidence, before
              formal review.
            </p>
          </div>
          <FooterCol
            title="Product"
            links={[
              { href: '/assessment', label: 'Readiness Assessment' },
              { href: '/services', label: 'How it works' },
              { href: '/resources', label: 'Resources' },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { href: '/about', label: 'About' },
              { href: '/contact', label: 'Contact' },
              { href: '/book', label: 'Book a demo' },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              { href: '/privacy', label: 'Privacy' },
              { href: '/terms', label: 'Terms' },
            ]}
          />
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-6 text-xs text-slate-500 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Aegis. All rights reserved.</p>
          <p className="font-mono">SOC 2 · ISO 27001 · HIPAA · NIST AI RMF-aligned</p>
        </div>
      </div>
    </footer>
  );
}

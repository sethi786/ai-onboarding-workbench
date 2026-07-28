import Link from 'next/link';
import { ShieldLogo } from '@/components/brand/ShieldLogo';

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">{title}</h4>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-white/70 transition-colors hover:text-white">
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
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <ShieldLogo tone="light" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/55">
              Bring every AI tool to review already cleared — governance, security, and go/no-go
              evidence, prepared before the formal gates.
            </p>
          </div>
          <FooterCol
            title="Product"
            links={[
              { href: '/services', label: 'Platform' },
              { href: '/assessment', label: 'The 20 lenses' },
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
        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/40 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Aegis. A self-evaluation and readiness aid.</p>
          <p className="font-mono tracking-tight">SOC 2 · ISO 27001 · HIPAA · NIST AI RMF-aligned</p>
        </div>
      </div>
    </footer>
  );
}

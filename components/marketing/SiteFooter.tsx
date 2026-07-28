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
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div>
            <ShieldLogo tone="light" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/55">
              Governance for every tool you adopt — SaaS, PaaS, on-prem, and AI. Security, privacy,
              legal, and risk review as one workflow.
            </p>
          </div>
          <FooterCol
            title="Platform"
            links={[
              { href: '/platform', label: 'Overview' },
              { href: '/use-cases', label: 'Use cases' },
              { href: '/solutions', label: 'Solutions' },
              { href: '/assessment', label: 'The 20 lenses' },
              { href: '/tools', label: 'Tool reviews' },
              { href: '/eu-ai-act', label: 'EU AI Act' },
              { href: '/pricing', label: 'Pricing' },
            ]}
          />
          <FooterCol
            title="Popular tools"
            links={[
              { href: '/tools/m365-copilot', label: 'Microsoft 365 Copilot' },
              { href: '/tools/chatgpt-enterprise', label: 'ChatGPT Enterprise' },
              { href: '/tools/salesforce-sales-cloud', label: 'Salesforce' },
              { href: '/tools/snowflake', label: 'Snowflake' },
              { href: '/tools/slack', label: 'Slack' },
              { href: '/tools', label: 'All tools →' },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { href: '/why-aegis', label: 'Why Aegis' },
              { href: '/resources', label: 'Guides' },
              { href: '/security', label: 'Security & Trust' },
              { href: '/about', label: 'About' },
              { href: '/contact', label: 'Contact' },
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

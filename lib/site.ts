/** Central brand + site constants for Aegis. */
export const SITE = {
  name: 'Aegis',
  tagline: 'Enterprise AI onboarding, cleared',
  description:
    'Aegis is the readiness platform for onboarding AI tools, agents, RAG apps, and connectors. ' +
    'Prepare architecture, security, privacy, legal, risk, and go/no-go review evidence across 20 ' +
    'enterprise review lenses — before formal approval.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  email: 'hello@aegis.ai',
} as const;

export const MARKETING_NAV = [
  { href: '/services', label: 'Product' },
  { href: '/assessment', label: 'Lenses' },
  { href: '/resources', label: 'Resources' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

/** Shown across the app and on every exported report. */
export const DISCLAIMER =
  'Aegis is a self-evaluation and readiness aid. It helps prepare review evidence and understand ' +
  'what each review area may examine. It does not replace official enterprise approval workflows. Final ' +
  'decisions must follow the organization’s formal architecture, security, privacy, legal, QRM/risk, data ' +
  'governance, platform, support, finance, change management, and go/no-go approval processes.';

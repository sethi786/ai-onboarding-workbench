/** Central brand + site constants for Aegis. */
export const SITE = {
  name: 'Aegis',
  tagline: 'Govern every tool you adopt',
  description:
    'Aegis replaces the slow, multi-department approval gauntlet for adopting new tools — SaaS, ' +
    'PaaS, on-prem, and AI. It runs security, privacy, legal, and risk review as one readiness ' +
    'workflow, so any tool reaches production cleared, documented, and governed — even without a ' +
    'full enterprise review org.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  email: 'hello@aegis.ai',
} as const;

/** Link with an optional supporting description (used in mega-menu panels). */
export type NavLink = { href: string; label: string; desc?: string };
export type NavColumn = { title: string; links: NavLink[] };
export type NavItem = { label: string; href: string; columns?: NavColumn[] };

/** Primary navigation — items with `columns` render as mega-menu panels. */
export const MEGA_NAV: NavItem[] = [
  {
    label: 'Platform',
    href: '/platform',
    columns: [
      {
        title: 'The platform',
        links: [
          { href: '/platform', label: 'Overview', desc: 'One workflow, intake to go-live' },
          { href: '/example-review', label: 'See a finished review', desc: 'The whole document, in full' },
          { href: '/platform#engine', label: 'Readiness Engine', desc: '0–100 score, risk, go/no-go' },
          { href: '/platform#lenses', label: '20 Review Lenses', desc: 'Security, privacy, legal, risk…' },
          { href: '/platform#evidence', label: 'Evidence Factory', desc: 'Draft SAR, PIA & approval packs' },
          { href: '/platform#workflow', label: 'Workflow & Approvals', desc: '25-stage lifecycle & sign-offs' },
          { href: '/platform#library', label: 'Tool Library', desc: 'Prefilled SaaS, PaaS & AI templates' },
        ],
      },
      {
        title: 'By tool',
        links: [
          { href: '/tools', label: 'All tool reviews', desc: 'What the review covers, tool by tool' },
          { href: '/eu-ai-act', label: 'EU AI Act readiness', desc: 'Deployer obligations from Aug 2026' },
          { href: '/tools/m365-copilot', label: 'Microsoft 365 Copilot', desc: 'Graph oversharing, PII, connectors' },
          { href: '/tools/chatgpt-enterprise', label: 'ChatGPT Enterprise', desc: 'Retention, connectors, custom GPTs' },
          { href: '/tools/salesforce-sales-cloud', label: 'Salesforce', desc: 'Client data, integrations, access' },
          { href: '/tools/snowflake', label: 'Snowflake', desc: 'Data residency, sharing, cost' },
        ],
      },
    ],
  },
  {
    label: 'Solutions',
    href: '/solutions',
    columns: [
      {
        title: 'By tool type',
        links: [
          { href: '/solutions/saas', label: 'SaaS applications', desc: 'Vendor apps & connectors' },
          { href: '/solutions/paas', label: 'PaaS & cloud', desc: 'Platforms, services, infra' },
          { href: '/solutions/on-prem', label: 'On-prem software', desc: 'Self-hosted & installed' },
          { href: '/solutions/ai-agents', label: 'AI & agents', desc: 'Copilots, RAG, autonomy' },
        ],
      },
      {
        title: 'By team',
        links: [
          { href: '/solutions/security', label: 'Security', desc: 'SAR, architecture, secure SDLC' },
          { href: '/solutions/privacy-legal', label: 'Privacy & Legal', desc: 'PIA, DPA, contracts' },
          { href: '/solutions/risk-grc', label: 'Risk & GRC', desc: 'Risk grade, controls, audit' },
          { href: '/solutions/it-platform', label: 'IT & Platform', desc: 'Identity, hosting, support' },
        ],
      },
      {
        title: 'By company size',
        links: [
          { href: '/solutions/small-business', label: 'Small business', desc: 'Enterprise rigor, no big org' },
          { href: '/solutions/mid-market', label: 'Mid-market', desc: 'Scale reviews consistently' },
          { href: '/solutions/enterprise', label: 'Enterprise', desc: 'Standardize every gate' },
        ],
      },
    ],
  },
  {
    label: 'Use cases',
    href: '/use-cases',
    columns: [
      {
        title: 'Start where you’re stuck',
        links: [
          { href: '/use-cases/security-questionnaire', label: 'A customer sent a security questionnaire', desc: 'Answer from a record, not memory' },
          { href: '/use-cases/shadow-ai', label: 'Unknown AI tools in use', desc: 'Find and triage shadow AI' },
          { href: '/use-cases/stalled-approval', label: 'A tool is blocked in review', desc: 'Surface the real blockers' },
          { href: '/use-cases/audit-prep', label: 'Preparing for SOC 2 / ISO', desc: 'Evidence your process ran' },
          { href: '/use-cases/vendor-access', label: 'A vendor wants access', desc: 'Scope and own the grant' },
          { href: '/use-cases/ai-rollout', label: 'Rolling out Copilot / ChatGPT', desc: 'Permissions before indexing' },
          { href: '/use-cases/slow-process', label: 'Approvals take months', desc: 'Make the fast path compliant' },
          { href: '/use-cases/diligence', label: 'In diligence or acquiring', desc: 'Build the data-room record' },
        ],
      },
    ],
  },
  {
    label: 'Why Aegis',
    href: '/why-aegis',
    columns: [
      {
        title: 'Why Aegis',
        links: [
          { href: '/why-aegis', label: 'vs. the manual process', desc: 'Weeks of email → one workflow' },
          { href: '/security', label: 'Security & Trust', desc: 'How we protect your data' },
          { href: '/assessment', label: 'The 20 lenses', desc: 'What every review inspects' },
          { href: '/resources', label: 'Guides', desc: 'Free reference reading' },
        ],
      },
    ],
  },
  { label: 'Resources', href: '/resources' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Company', href: '/about' },
];

/** Flat nav (mobile fallback / simple contexts). */
export const MARKETING_NAV: NavLink[] = [
  { href: '/platform', label: 'Platform' },
  { href: '/solutions', label: 'Solutions' },
  { href: '/why-aegis', label: 'Why Aegis' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'Company' },
];

/** Shown across the app and on every exported report. */
export const DISCLAIMER =
  'Aegis is a self-evaluation and readiness aid. It helps prepare review evidence and understand ' +
  'what each review area may examine. It does not replace official enterprise approval workflows. Final ' +
  'decisions must follow the organization’s formal architecture, security, privacy, legal, QRM/risk, data ' +
  'governance, platform, support, finance, change management, and go/no-go approval processes.';

/** Solution definitions that drive the Solutions hub and dynamic detail pages. */

export type SolutionGroup = 'By tool type' | 'By team' | 'By company size';

export type Solution = {
  slug: string;
  group: SolutionGroup;
  eyebrow: string;
  title: string;
  subtitle: string;
  problem: string;
  points: { t: string; d: string }[];
  lenses: string[];
  outcome: string;
};

export const SOLUTIONS: Solution[] = [
  // ---- By tool type ----
  {
    slug: 'saas',
    group: 'By tool type',
    eyebrow: 'SaaS applications',
    title: 'Clear SaaS apps before they touch your data',
    subtitle:
      'Every new SaaS vendor is a data-processing agreement, an OAuth scope, and a shared-responsibility question waiting to be answered. Aegis turns that into a repeatable review.',
    problem:
      'A team wants Slack, a CRM, an analytics tool. Procurement, Security, Privacy, and Legal each need something different — and each finds out about the tool at a different time. The request stalls for weeks.',
    points: [
      { t: 'Vendor & data mapping', d: 'Capture what data the app touches, where it lives, and the sub-processors behind it — once, in one place.' },
      { t: 'OAuth & connector scopes', d: 'Model the permissions the app requests against least-privilege, so over-broad scopes are caught before grant.' },
      { t: 'DPA & contract evidence', d: 'Generate the privacy and legal evidence pack reviewers ask for, prefilled from the app profile.' },
    ],
    lenses: ['Security / SAR', 'Privacy / PIA', 'Legal / OGC', 'Data Governance', 'Vendor & Third-Party'],
    outcome: 'Every SaaS request arrives at review with its data map, scopes, and DPA evidence already attached.',
  },
  {
    slug: 'paas',
    group: 'By tool type',
    eyebrow: 'PaaS & cloud services',
    title: 'Govern the platforms you build on',
    subtitle:
      'Cloud platforms and managed services carry architecture, identity, and residency questions that outlast any single project. Aegis makes those answers durable.',
    problem:
      'Adopting a new cloud service means architecture review, identity design, data-residency checks, and cost sign-off — usually rediscovered from scratch each time.',
    points: [
      { t: 'Architecture readiness', d: 'Walk the architecture lens with the exact diagrams and controls platform reviewers expect.' },
      { t: 'Identity & access design', d: 'Model SSO, roles, and privileged access up front instead of retrofitting them after launch.' },
      { t: 'Residency & hosting', d: 'Document where data lives and how the service meets your hosting and sovereignty requirements.' },
    ],
    lenses: ['Architecture', 'Security / SAR', 'Identity & Access', 'Platform & Hosting', 'Data Governance'],
    outcome: 'Platform decisions come with architecture, identity, and residency evidence that survives audits.',
  },
  {
    slug: 'on-prem',
    group: 'By tool type',
    eyebrow: 'On-prem & self-hosted',
    title: 'Bring installed software through the same gate',
    subtitle:
      'Self-hosted and on-prem software shifts the security burden onto you. Aegis captures the hardening, patching, and secure-SDLC evidence that shift demands.',
    problem:
      'On-prem tools skip vendor SOC 2 shortcuts — now you own the hardening, the patch cadence, and the supply-chain risk, and reviewers know it.',
    points: [
      { t: 'Secure deployment', d: 'Hardening baselines, network placement, and secrets handling captured as first-class controls.' },
      { t: 'Patch & lifecycle', d: 'Document ownership, patch cadence, and end-of-life so the tool never becomes an orphaned risk.' },
      { t: 'Supply-chain integrity', d: 'Record provenance, signing, and dependency review for software you run yourself.' },
    ],
    lenses: ['Architecture', 'Secure SDLC', 'Security / SAR', 'Platform & Hosting', 'Support & Operations'],
    outcome: 'Self-hosted tools carry the hardening and lifecycle evidence that on-prem ownership requires.',
  },
  {
    slug: 'ai-agents',
    group: 'By tool type',
    eyebrow: 'AI, copilots & agents',
    title: 'The governance AI adoption actually needs',
    subtitle:
      'Copilots, RAG apps, and autonomous agents add autonomy, tool permissions, and model risk on top of every normal review. Aegis models all of it — the flagship use case.',
    problem:
      'AI tools fail review on the things a normal checklist misses: autonomy limits, tool permissions, prompt-injection exposure, model provenance, and human-in-the-loop controls.',
    points: [
      { t: 'Agent & connector governance', d: 'Autonomy scopes, tool permissions, kill switches, and identity modeled as controls, not afterthoughts.' },
      { t: 'Model & data risk', d: 'Provenance, training-data exposure, RAG source controls, and DLP for what the model can see and say.' },
      { t: 'Human-in-the-loop', d: 'Prove where a human approves, where the agent can act alone, and how that line is enforced.' },
    ],
    lenses: ['Agent Governance', 'Security / SAR', 'Privacy / PIA', 'AI Risk & Model', 'Data Governance'],
    outcome: 'AI tools reach production with autonomy, model, and data-risk controls documented and defensible.',
  },
  // ---- By team ----
  {
    slug: 'security',
    group: 'By team',
    eyebrow: 'For Security',
    title: 'Stop discovering tools at launch',
    subtitle:
      'Security shouldn’t be the last gate a tool hits with the least time. Aegis brings the SAR, architecture, and secure-SDLC evidence to you early and structured.',
    problem:
      'By the time a tool reaches Security, the business has already decided. You get days to assess weeks of decisions.',
    points: [
      { t: 'Structured SAR intake', d: 'Every request arrives with the security assessment inputs already gathered.' },
      { t: 'Blockers surfaced early', d: 'Hardcoded secrets, missing MFA, and over-broad access show up at intake, not at go-live.' },
      { t: 'Evidence you can audit', d: 'A durable record of what was reviewed, by whom, and what was decided.' },
    ],
    lenses: ['Security / SAR', 'Architecture', 'Secure SDLC', 'Identity & Access', 'Agent Governance'],
    outcome: 'Security reviews start earlier, with complete inputs and a clean audit trail.',
  },
  {
    slug: 'privacy-legal',
    group: 'By team',
    eyebrow: 'For Privacy & Legal',
    title: 'PIA and contract evidence, prepared in advance',
    subtitle:
      'Privacy and Legal keep answering the same questions about data, sub-processors, and terms. Aegis captures those answers once and drafts the packs for you.',
    problem:
      'Every tool triggers the same privacy and contract questions — asked ad hoc, answered from scratch, tracked in email.',
    points: [
      { t: 'Draft PIA & DPA packs', d: 'Generate privacy-impact and data-processing evidence prefilled from the tool profile.' },
      { t: 'Data-flow clarity', d: 'A clear map of personal data, purpose, retention, and cross-border transfer per tool.' },
      { t: 'Contract checkpoints', d: 'Surface the terms and clauses that matter before signature, not after.' },
    ],
    lenses: ['Privacy / PIA', 'Legal / OGC', 'Data Governance', 'Vendor & Third-Party'],
    outcome: 'Privacy and Legal review from a prepared pack instead of a blank page.',
  },
  {
    slug: 'risk-grc',
    group: 'By team',
    eyebrow: 'For Risk & GRC',
    title: 'One readiness number leadership trusts',
    subtitle:
      'GRC needs consistency and evidence, not vibes. Aegis produces a weighted risk grade and a defensible control record for every tool, the same way every time.',
    problem:
      'Risk decisions vary by who ran the review. There’s no consistent score, and the evidence is scattered.',
    points: [
      { t: 'Weighted risk grade', d: 'A consistent Low→Critical grade derived from the same engine across every tool.' },
      { t: 'Control coverage', d: 'See which required controls and evidence are complete — and which aren’t — at a glance.' },
      { t: 'Audit-ready record', d: 'Export the full go/no-go pack with owners, dates, and decisions for auditors.' },
    ],
    lenses: ['Risk / QRM', 'Data Governance', 'Security / SAR', 'Legal / OGC'],
    outcome: 'Every tool gets the same rigorous, exportable risk assessment — no matter who runs it.',
  },
  {
    slug: 'it-platform',
    group: 'By team',
    eyebrow: 'For IT & Platform',
    title: 'Own identity, hosting, and support up front',
    subtitle:
      'IT inherits every tool after go-live. Aegis makes the identity, hosting, and supportability decisions explicit before the tool is live, not after the tickets start.',
    problem:
      'Tools land in production and IT discovers the SSO gaps, the unowned hosting, and the missing runbooks the hard way.',
    points: [
      { t: 'Identity & SSO', d: 'Confirm SSO, provisioning, and offboarding are designed before rollout.' },
      { t: 'Hosting & ownership', d: 'Name the owner, the environment, and the operational model per tool.' },
      { t: 'Supportability', d: 'Runbooks, escalation, and lifecycle captured so support isn’t an afterthought.' },
    ],
    lenses: ['Identity & Access', 'Platform & Hosting', 'Support & Operations', 'Architecture'],
    outcome: 'IT gets tools that are already integrated, owned, and supportable on day one.',
  },
  // ---- By company size ----
  {
    slug: 'small-business',
    group: 'By company size',
    eyebrow: 'For small business',
    title: 'Enterprise-grade governance without the org',
    subtitle:
      'You don’t have a Security team, a Privacy office, and a GRC function. Aegis gives you the review process those functions would run — as a guided workflow.',
    problem:
      'Small teams either skip governance (and inherit the risk) or drown trying to do it manually. Neither is a real option once you handle customer data.',
    points: [
      { t: 'The whole review, guided', d: 'Aegis stands in for the departments you don’t have, one lens at a time.' },
      { t: 'Prefilled templates', d: 'Start from a populated evaluation for common tools, so you’re at 60%, not zero.' },
      { t: 'Proof for customers & auditors', d: 'Produce the evidence enterprise buyers and auditors ask you for.' },
    ],
    lenses: ['Security / SAR', 'Privacy / PIA', 'Risk / QRM', 'Data Governance', 'Identity & Access'],
    outcome: 'A small team adopts tools with the same rigor a Fortune 500 review board would apply.',
  },
  {
    slug: 'mid-market',
    group: 'By company size',
    eyebrow: 'For mid-market',
    title: 'Make every review consistent as you scale',
    subtitle:
      'Growth multiplies tool requests faster than headcount. Aegis keeps every review consistent, so quality doesn’t drop as volume climbs.',
    problem:
      'Reviews depend on a few overloaded people. Standards drift, backlogs grow, and the newest reviewer sets the bar.',
    points: [
      { t: 'One repeatable workflow', d: 'The 25-stage lifecycle runs the same for every tool and every reviewer.' },
      { t: 'Shared control tower', d: 'Leadership sees the whole portfolio of tools and their readiness in one view.' },
      { t: 'Owners & due dates', d: 'Assign, track, and sign off — no more lost threads in email.' },
    ],
    lenses: ['All 20 lenses, applied by tool profile'],
    outcome: 'Review quality holds steady even as tool requests scale past what people can track manually.',
  },
  {
    slug: 'enterprise',
    group: 'By company size',
    eyebrow: 'For enterprise',
    title: 'Standardize every gate across the org',
    subtitle:
      'You have the review teams — what you lack is a single, evidenced workflow that connects them. Aegis is the connective tissue across architecture, security, privacy, legal, and risk.',
    problem:
      'Each function runs its own process in its own tool. Handoffs are manual, evidence is siloed, and there’s no single source of readiness truth.',
    points: [
      { t: 'Multi-tenant workspaces', d: 'Business units, roles, and RBAC with strict data isolation.' },
      { t: 'Custom lenses & templates', d: 'Encode your organization’s specific gates and required evidence.' },
      { t: 'Audit & retention', d: 'Enterprise controls, SSO/SCIM, and a defensible record for every decision.' },
    ],
    lenses: ['All 20 lenses + custom organization gates'],
    outcome: 'Every review team works from one connected, evidenced workflow — not twelve disconnected ones.',
  },
];

export const SOLUTION_BY_SLUG = Object.fromEntries(SOLUTIONS.map((s) => [s.slug, s])) as Record<
  string,
  Solution
>;

export const SOLUTION_GROUPS: SolutionGroup[] = ['By tool type', 'By team', 'By company size'];

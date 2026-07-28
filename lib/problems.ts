/**
 * Buyer-first entry points. People don't search for "governance platform" — they
 * search for the specific thing that is blocking them this week. Each problem is a
 * real trigger, written the way the person experiencing it would describe it.
 */

export type Problem = {
  slug: string;
  /** How the buyer says it out loud. Used as the router label. */
  trigger: string;
  /** Who typically hits this. */
  who: string;
  title: string;
  subtitle: string;
  /** What is actually happening in the org right now. */
  symptom: string;
  /** What it costs them today, concretely. */
  costs: string[];
  /** What Aegis does about it, in order. */
  steps: { t: string; d: string }[];
  /** Artifacts they end up holding. */
  deliverables: string[];
  lenses: string[];
};

export const PROBLEMS: Problem[] = [
  {
    slug: 'security-questionnaire',
    trigger: 'A customer sent us a security questionnaire',
    who: 'Founders · Sales engineers · IT leads',
    title: 'You have 200 questions and a deal waiting on the answers',
    subtitle:
      'Enterprise buyers gate purchases behind SIG Lite, CAIQ, or a homegrown spreadsheet. Answering it means knowing exactly which tools touch customer data, how they are controlled, and where the evidence lives.',
    symptom:
      'A deal is in late stage. Their security team sends a questionnaire asking about your sub-processors, access controls, data flows, and vendor review process. Nobody on your side owns the answers, so it lands on whoever is least busy — and stalls for two weeks.',
    costs: [
      'Deals sit in limbo while one person reverse-engineers answers from memory',
      'Inconsistent answers across questionnaires create follow-up rounds and credibility damage',
      '“Do you have a documented third-party review process?” is answered “yes” with nothing to attach',
      'The same work restarts from zero for the next customer',
    ],
    steps: [
      {
        t: 'Inventory what actually touches customer data',
        d: 'Every tool gets a profile: vendor, data types, classification, hosting, and whether personal or client data is in scope. That inventory is the backbone of half the questionnaire.',
      },
      {
        t: 'Run the review that the questions assume you ran',
        d: 'Walk the security, privacy, data governance, and vendor lenses. The controls the questionnaire asks about are the controls you check off — with evidence attached.',
      },
      {
        t: 'Answer from a record, not from memory',
        d: 'Export the evidence pack and answer each item from documented state. Next questionnaire reuses the same record instead of starting over.',
      },
    ],
    deliverables: [
      'A tool-by-tool inventory with data classification and hosting',
      'Documented control coverage per tool',
      'A draft security assessment record you can attach',
      'A repeatable process to point at when asked "do you have one?"',
    ],
    lenses: ['Security / SAR', 'Privacy / PIA', 'Data Governance', 'Vendor & Third-Party'],
  },
  {
    slug: 'shadow-ai',
    trigger: 'We don’t know what AI tools employees are already using',
    who: 'CISOs · IT directors · Compliance',
    title: 'Shadow AI is already in your org. The question is what it can reach.',
    subtitle:
      'Employees adopt AI tools on personal logins and company cards long before anyone reviews them. The risk is not that they use AI — it is that nobody knows what data those tools can see.',
    symptom:
      'Someone pastes a customer contract into a free chatbot. A team wires an AI note-taker into every meeting. A developer grants a coding assistant repo-wide access. None of it went through review, and none of it is written down.',
    costs: [
      'Confidential and personal data leaves your control with no record of it',
      'OAuth grants accumulate silently — an AI tool with mailbox or drive scope is a standing risk',
      'You cannot answer an auditor or a customer asking which AI tools process their data',
      'The first real inventory usually happens after an incident, not before',
    ],
    steps: [
      {
        t: 'Get everything into one register',
        d: 'Log every known AI tool — sanctioned or not — with what it connects to, who owns it, and what data class it touches. An imperfect inventory beats no inventory.',
      },
      {
        t: 'Triage by exposure, not by popularity',
        d: 'Score each one. Tools with autonomy, connector scopes, or personal data rise to the top; a standalone summarizer does not need the same scrutiny.',
      },
      {
        t: 'Sanction, condition, or retire',
        d: 'Each tool gets an explicit decision with the conditions attached — and a documented owner who is accountable for it.',
      },
    ],
    deliverables: [
      'A live register of AI tools in use, with owners',
      'A risk grade and readiness score per tool',
      'An explicit sanction / condition / retire decision on each',
      'A defensible answer to "what AI touches our data?"',
    ],
    lenses: ['Agent Governance', 'Security / SAR', 'Privacy / PIA', 'Identity & Access'],
  },
  {
    slug: 'stalled-approval',
    trigger: 'Security or Legal is blocking a tool the business needs',
    who: 'Business owners · Product · IT',
    title: 'The tool isn’t blocked. The evidence is missing.',
    subtitle:
      'Most stalled approvals are not a "no" — they are a reviewer who cannot say yes because a control is unproven or a question is unanswered, and nobody has told you which one.',
    symptom:
      'The request has been open for six weeks. Security asked for an architecture diagram, Privacy wants to know about retention, Legal is waiting on the DPA — and each is waiting on a different person who does not know they are the blocker.',
    costs: [
      'Weeks of calendar time lost to sequential, invisible dependencies',
      'The business starts using the tool anyway, unsanctioned, to get work done',
      'Reviewers are blamed for being slow when they are simply missing inputs',
      'No one can say what specifically has to be true for approval',
    ],
    steps: [
      {
        t: 'Make the blockers explicit',
        d: 'Run the tool through the lenses that apply to it. Anything unproven surfaces as a named blocker — not a vague "security concerns."',
      },
      {
        t: 'Fix the ones that count',
        d: 'A critical blocker forces readiness to zero, so priority is unambiguous. Everything else is scored, ranked, and assignable.',
      },
      {
        t: 'Hand reviewers a prepared pack',
        d: 'Architecture summary, data map, control coverage, and residual risk arrive together — so review becomes verification instead of discovery.',
      },
    ],
    deliverables: [
      'A named list of what is actually blocking approval',
      'Owners and due dates against each blocker',
      'A draft evidence pack for the reviewing teams',
      'A go / conditional / no-go recommendation with reasoning',
    ],
    lenses: ['Security / SAR', 'Privacy / PIA', 'Legal / OGC', 'Architecture', 'Risk / QRM'],
  },
  {
    slug: 'audit-prep',
    trigger: 'We’re preparing for a SOC 2 or ISO audit',
    who: 'Compliance · GRC · Founders',
    title: 'Auditors ask how you vet tools. Have an answer that isn’t a story.',
    subtitle:
      'Vendor management and change control are audit staples. What auditors want is not a policy document — it is proof the process ran, consistently, with records.',
    symptom:
      'You have a written vendor-management policy. What you do not have is evidence that the last eleven tools you adopted actually went through it, who approved them, and on what basis.',
    costs: [
      'Evidence gets reconstructed under deadline, from Slack threads and inboxes',
      'Findings land on process consistency rather than on genuine security gaps',
      'Each audit cycle repeats the same scramble because nothing was captured as you went',
      'Policy says one thing; the record shows another',
    ],
    steps: [
      {
        t: 'Run every adoption through one workflow',
        d: 'The same lifecycle, lenses, and sign-offs apply to every tool — which is exactly the consistency an auditor is testing for.',
      },
      {
        t: 'Capture decisions as they happen',
        d: 'Owners, dates, control coverage, residual risk, and approvals are recorded at the time, not reassembled later.',
      },
      {
        t: 'Export the record on request',
        d: 'Produce a per-tool decision pack and a portfolio view showing the process ran the same way every time.',
      },
    ],
    deliverables: [
      'A per-tool approval record with owners and dates',
      'Control coverage mapped across the portfolio',
      'Exportable go/no-go packs for sampled tools',
      'Evidence that policy and practice actually match',
    ],
    lenses: ['Risk / QRM', 'Data Governance', 'Security / SAR', 'Legal / OGC'],
  },
  {
    slug: 'vendor-access',
    trigger: 'A vendor wants access to our systems or data',
    who: 'Security · Procurement · IT',
    title: 'Third-party access is the risk you inherit and keep',
    subtitle:
      'A vendor integration is a standing grant of access that outlives the project, the champion, and often the contract. It deserves more than a logo check and a SOC 2 PDF on file.',
    symptom:
      'A vendor asks for an API key, an OAuth grant, or a VPN path. Someone forwards their SOC 2 report, it gets skimmed, and access is granted — with no record of scope, no expiry, and no owner.',
    costs: [
      'Over-broad scopes granted once and never reviewed again',
      'Sub-processors behind the vendor are never assessed at all',
      'No named owner means no one revokes access when the project ends',
      'Their breach becomes your incident, with your customers asking the questions',
    ],
    steps: [
      {
        t: 'Scope the access precisely',
        d: 'Document exactly what the vendor can reach, under which identity, with which permissions — measured against least privilege.',
      },
      {
        t: 'Assess the vendor, not just the paperwork',
        d: 'Run the vendor, privacy, and legal lenses: sub-processors, data residency, retention, breach notification, and contract terms.',
      },
      {
        t: 'Attach an owner and a review date',
        d: 'Every grant gets an accountable owner and a scheduled re-review, so access does not quietly become permanent.',
      },
    ],
    deliverables: [
      'A documented access scope with least-privilege justification',
      'A vendor risk assessment covering sub-processors and residency',
      'Contract and DPA checkpoints surfaced before signature',
      'An owner and re-review date on every grant',
    ],
    lenses: ['Vendor & Third-Party', 'Identity & Access', 'Legal / OGC', 'Security / SAR'],
  },
  {
    slug: 'ai-rollout',
    trigger: 'We’re rolling out Copilot or ChatGPT company-wide',
    who: 'AI program leads · IT · Security',
    title: 'A company-wide AI rollout is a permissions project wearing a productivity hat',
    subtitle:
      'Assistants that read your files inherit your permission model — including everything that was quietly over-shared for years. The rollout surfaces it all at once.',
    symptom:
      'Leadership wants AI deployed this quarter. The tool indexes SharePoint, Drive, and mailboxes. Within a week someone surfaces a salary file or an unreleased document they were technically able to open all along.',
    costs: [
      'Years of permission drift become instantly searchable by every employee',
      'Sensitive content surfaces through legitimate access nobody realized existed',
      'Retention, eDiscovery, and prompt-logging questions arrive after go-live',
      'The rollout gets paused publicly, costing far more trust than doing it in order',
    ],
    steps: [
      {
        t: 'Review the permission model before you index',
        d: 'Treat over-sharing as the primary risk. Scope the pilot, trim permissions, and confirm what the assistant is allowed to see.',
      },
      {
        t: 'Decide the data and retention rules up front',
        d: 'Prompt logging, retention, regional processing, and whether your content trains anything — answered before rollout, not after.',
      },
      {
        t: 'Stage the rollout behind gates',
        d: 'Pilot, review, expand. Each stage has owners, exit criteria, and a documented decision to proceed.',
      },
    ],
    deliverables: [
      'A documented permission and data-exposure review',
      'Retention, logging, and residency decisions on record',
      'A staged rollout plan with exit criteria per stage',
      'A go/no-go pack for the expansion decision',
    ],
    lenses: ['Data Governance', 'Identity & Access', 'Privacy / PIA', 'Agent Governance', 'Security / SAR'],
  },
  {
    slug: 'slow-process',
    trigger: 'Our approval process takes months and everyone routes around it',
    who: 'CIOs · Heads of GRC · IT leadership',
    title: 'A process people bypass is not a control',
    subtitle:
      'When review takes a quarter, teams stop asking. The governance function keeps its authority on paper and loses it in practice — which is worse than having none, because you believe you are covered.',
    symptom:
      'Requests arrive by email, get triaged by whoever notices, and move through five teams sequentially. Meanwhile a manager expenses the tool and rolls it out to forty people without telling anyone.',
    costs: [
      'Shadow adoption becomes the default path because it is the fast one',
      'Review quality varies by reviewer, with no consistent standard',
      'Leadership has no portfolio view of what is in flight or stuck',
      'Governance is measured by delay rather than by risk reduced',
    ],
    steps: [
      {
        t: 'Scope review to the tool’s actual risk',
        d: 'A standalone note app should not face the same gauntlet as an autonomous agent. Required lenses are driven by the tool profile.',
      },
      {
        t: 'Run stages in parallel with visible ownership',
        d: 'Everyone sees the same board: stage, owner, due date, blockers. Sequential email handoffs stop being the mechanism.',
      },
      {
        t: 'Make the fast path the compliant path',
        d: 'Prefilled templates and generated evidence mean going through the process is quicker than going around it.',
      },
    ],
    deliverables: [
      'Risk-scaled review scope per tool',
      'A shared portfolio board with owners and due dates',
      'Cycle-time visibility on where requests actually stall',
      'A process teams use because it is faster than the workaround',
    ],
    lenses: ['All 20 lenses, scoped by tool profile'],
  },
  {
    slug: 'diligence',
    trigger: 'We’re in diligence — or acquiring someone',
    who: 'Founders · Corp dev · CISOs',
    title: 'Diligence asks what you adopted, why, and who approved it',
    subtitle:
      'Whether you are being bought or doing the buying, tool governance shows up in the data room. Gaps become price adjustments, escrow, or post-close remediation you inherit.',
    symptom:
      'The diligence checklist asks for your third-party inventory, your data-flow map, and your approval records. You have a spreadsheet from eighteen months ago and a lot of institutional memory.',
    costs: [
      'Unknown data flows and vendor access get discovered by the other side first',
      'Missing approval records read as weak controls and reduce valuation',
      'Post-close remediation lands on a team that did not create the problem',
      'Timeline slips while the record is assembled under pressure',
    ],
    steps: [
      {
        t: 'Build the inventory the data room will ask for',
        d: 'Tools, vendors, data classes, hosting, owners, and access — in one exportable place.',
      },
      {
        t: 'Show the process behind the decisions',
        d: 'Not just what you use, but how it was reviewed and approved, with dates and accountable owners.',
      },
      {
        t: 'Flag and price the real gaps yourself',
        d: 'Surface residual risk deliberately, with a remediation plan attached, rather than letting the other side find it.',
      },
    ],
    deliverables: [
      'An exportable third-party and tool inventory',
      'Data-flow and hosting documentation per tool',
      'Approval records with owners and dates',
      'A residual-risk register with remediation plans',
    ],
    lenses: ['Vendor & Third-Party', 'Data Governance', 'Risk / QRM', 'Legal / OGC', 'Security / SAR'],
  },
];

export const PROBLEM_BY_SLUG = Object.fromEntries(PROBLEMS.map((p) => [p.slug, p])) as Record<
  string,
  Problem
>;

/**
 * The resource library. These are real, readable reference guides — not gated
 * teasers. If we can't write something genuinely useful about a topic, it doesn't
 * get a card here.
 */

export type GuideSection = {
  h: string;
  body?: string[];
  list?: string[];
  /** Optional numbered/labelled rows, e.g. question → what they're really asking. */
  pairs?: { k: string; v: string }[];
};

export type Guide = {
  slug: string;
  kind: 'Guide' | 'Checklist' | 'Reference' | 'Template';
  title: string;
  dek: string;
  minutes: number;
  intro: string[];
  sections: GuideSection[];
  takeaway: string;
};

export const GUIDES: Guide[] = [
  {
    slug: 'security-questionnaire-answers',
    kind: 'Guide',
    title: 'The 12 questions every security questionnaire asks',
    dek: 'SIG, CAIQ, and homegrown spreadsheets differ in length, not substance. Here is what they are all actually asking, and what a good answer contains.',
    minutes: 9,
    intro: [
      'Security questionnaires look intimidating because they are long. They are not, however, particularly varied. Strip the formatting and most of them are probing the same dozen things — usually to decide whether your failure would become their incident.',
      'The answers that move fastest are specific, verifiable, and boring. Vague confidence reads as risk. "We take security seriously" invites a follow-up round; "access is granted by role, reviewed quarterly, last reviewed 12 March" ends the thread.',
    ],
    sections: [
      {
        h: 'What they are really asking',
        pairs: [
          { k: 'Do you have an inventory of third parties?', v: 'Can you name every vendor that touches our data — including the sub-processors behind them?' },
          { k: 'How do you vet new tools?', v: 'Is there a consistent process, or does it depend on who happened to run it?' },
          { k: 'Where is our data stored and processed?', v: 'Which regions, which providers, and can you prove it if a regulator asks?' },
          { k: 'How is access controlled?', v: 'Least privilege, MFA, and joiner-mover-leaver — with evidence it is enforced, not just written down.' },
          { k: 'How is data encrypted?', v: 'In transit and at rest, with key management that is not "the cloud handles it".' },
          { k: 'What is your retention and deletion policy?', v: 'Can you actually delete our data on request, everywhere, including backups?' },
          { k: 'Do you have logging and monitoring?', v: 'Would you detect a compromise, and could you reconstruct what happened?' },
          { k: 'What is your incident response process?', v: 'Who decides, who is notified, and within what window — contractually?' },
          { k: 'Do you run vulnerability management?', v: 'Scanning, patch SLAs by severity, and evidence the SLAs are met.' },
          { k: 'Is your code developed securely?', v: 'Review, dependency scanning, and secrets kept out of repositories.' },
          { k: 'What is your business continuity posture?', v: 'Backups that are tested, and an RTO/RPO you would actually stand behind.' },
          { k: 'Do you use AI, and how?', v: 'Which models, whether our data trains them, and what the AI can reach. This one is new and increasingly decisive.' },
        ],
      },
      {
        h: 'What makes an answer land',
        list: [
          'Name the control, not the intention. "Quarterly access reviews" beats "we review access regularly".',
          'Attach or reference evidence. A policy plus proof it ran is worth ten policies alone.',
          'State scope honestly. "Production only, corporate laptops out of scope" is a stronger answer than an overclaim that unravels later.',
          'Answer "no" cleanly when it is no, with the compensating control and a date. Reviewers respect that; they punish discovered gaps.',
          'Keep answers consistent across questionnaires — contradictions between two customers are found more often than you would think.',
        ],
      },
      {
        h: 'The mistake that costs the most time',
        body: [
          'Answering from memory. The first questionnaire gets answered by one knowledgeable person in a heroic week. The second arrives three months later, that person is busy, and their answers are slightly different — which triggers clarification rounds and erodes trust.',
          'The fix is unglamorous: keep a living record of your tools, their data classes, and their control coverage, updated as you adopt things rather than when a deal is on the line. Then questionnaires become transcription rather than investigation.',
        ],
      },
    ],
    takeaway:
      'A questionnaire is a test of whether you have a process, not whether you can write well under deadline. Build the record first and answering becomes clerical.',
  },
  {
    slug: 'finding-shadow-ai',
    kind: 'Guide',
    title: 'Finding shadow AI: a practical inventory method',
    dek: 'You will not find every AI tool in use, and chasing completeness is how these projects stall. Here is a method that gets you to a useful inventory in about a week.',
    minutes: 8,
    intro: [
      'Every organization past about twenty people has AI tools in use that nobody reviewed. Blocking them wholesale does not work — it moves usage to personal devices, where you have no visibility at all.',
      'The goal is not a perfect census. It is knowing which AI tools can reach sensitive data, so you can make deliberate decisions about the handful that matter.',
    ],
    sections: [
      {
        h: 'Five places to look, in order of yield',
        list: [
          'Expense and card data. Search the last two quarters for AI vendors. This finds team-level adoption fastest and gives you a named owner immediately.',
          'OAuth grants in your identity provider. Review third-party apps with access to mail, files, or calendars. This is the highest-risk category and the most commonly missed.',
          'Browser or network telemetry, if you have it. Domain-level visibility of AI services indicates usage volume, not just presence.',
          'SaaS admin consoles. Marketplace apps and integrations inside Slack, Microsoft 365, Google Workspace, Salesforce, and your code host.',
          'Ask people directly, without threat of punishment. An amnesty question — "what AI tools help you do your job?" — routinely surfaces more than tooling does. It only works if the answer is not punished.',
        ],
      },
      {
        h: 'Triage by exposure, not by name recognition',
        body: [
          'Once you have a list, resist the urge to review everything equally. Rank by what the tool can actually reach.',
        ],
        list: [
          'Highest: tools with standing OAuth access to mail, files, or code; anything that can take actions autonomously.',
          'High: tools processing personal, client, or regulated data, even manually pasted.',
          'Moderate: tools handling internal but non-sensitive content.',
          'Low: standalone tools operating on public information with no integration.',
        ],
      },
      {
        h: 'Close the loop with a decision',
        body: [
          'An inventory that produces no decisions decays into a stale spreadsheet within a quarter. Every tool on the list should end with one of three outcomes: sanctioned, sanctioned with conditions, or retired — each with a named owner and a review date.',
          'Conditions are where most of the value sits. "Approved for internal documents, not client data, with connector scope limited to the marketing drive" is a real control. "Approved" alone is not.',
        ],
      },
      {
        h: 'What to do about the tool you cannot kill',
        body: [
          'There is usually one tool that is technically unsanctioned and operationally load-bearing. Ripping it out creates more risk than it removes, and everyone knows it.',
          'Treat it as an accepted risk with a written expiry rather than pretending it is not there. Document what it touches, tighten the scope where you can, name an accountable owner, and set a date to revisit. Documented and time-boxed beats invisible.',
        ],
      },
    ],
    takeaway:
      'Aim for the twenty percent of AI tools carrying eighty percent of the exposure, decide on each one explicitly, and revisit on a schedule. Perfection is the enemy of an inventory that ships.',
  },
  {
    slug: 'vendor-security-assessment',
    kind: 'Reference',
    title: 'What a vendor security assessment actually reviews',
    dek: 'A SOC 2 report on file is not an assessment. Here is what a real third-party review covers, and where the genuine risk usually hides.',
    minutes: 10,
    intro: [
      'Most vendor reviews stop at collecting a SOC 2 Type II report and confirming it exists. That report is useful, but it describes the vendor\'s controls against their own stated scope — which frequently excludes the exact system you are about to integrate.',
      'A real assessment asks what this vendor can reach in your environment, what happens to your data inside theirs, and what you are contractually owed when something goes wrong.',
    ],
    sections: [
      {
        h: 'Read the attestation properly',
        list: [
          'Check the scope section first. A SOC 2 covering only the vendor\'s primary platform tells you nothing about the new AI feature you are buying.',
          'Check the period. An attestation covering a window that ended fourteen months ago is a historical document.',
          'Read the exceptions. Most people skip to the opinion; the exceptions are where the useful information is.',
          'Note the complementary user entity controls. These are the things the report assumes *you* are doing. Frequently you are not.',
        ],
      },
      {
        h: 'Map the data, precisely',
        list: [
          'What data classes flow to the vendor, including anything incidental like support attachments or debug logs.',
          'Where it is stored and processed — regions matter for residency commitments you have made to your own customers.',
          'Which sub-processors sit behind them. Your customers hold you responsible for the whole chain, not just the name on the invoice.',
          'Retention and deletion: whether deletion is real, how long backups persist, and whether it is contractual or aspirational.',
        ],
      },
      {
        h: 'Scope the access grant',
        body: [
          'This is where third-party risk actually materializes, and where reviews are thinnest. An integration is a standing grant of access that outlives the project that requested it.',
        ],
        list: [
          'What identity does the vendor use, and is it separable from a human account?',
          'What exact permissions are requested versus required? Over-broad OAuth scopes are the norm; narrowing them is usually possible and rarely attempted.',
          'Can access be revoked unilaterally and quickly, and does anyone know how?',
          'Is there an owner and a re-review date, or is the grant permanent by default?',
        ],
      },
      {
        h: 'Get the contract terms that matter',
        list: [
          'Breach notification with a defined window — "without undue delay" is not a window.',
          'A DPA with sub-processor change notice and a right to object.',
          'Audit or evidence rights proportionate to the risk.',
          'Data return and deletion on termination, with a deadline.',
          'For AI vendors specifically: an explicit statement that your content does not train their models, and clarity on retention of prompts and outputs.',
        ],
      },
      {
        h: 'Where the real risk usually is',
        body: [
          'In practice, the finding that matters is rarely an exotic vulnerability at the vendor. It is an over-broad access grant nobody revisited, a sub-processor nobody assessed, or a deletion promise nobody tested.',
          'Those three are cheap to check and are what you will wish you had documented when a customer asks after the vendor makes the news.',
        ],
      },
    ],
    takeaway:
      'Assess the access and the data chain, not just the paperwork. The attestation tells you about the vendor; the scope of the grant tells you about your exposure.',
  },
  {
    slug: 'ai-agent-governance-controls',
    kind: 'Checklist',
    title: 'AI agent governance: the controls that decide approval',
    dek: 'Agents fail review for reasons a standard software checklist does not cover. These are the controls reviewers actually press on.',
    minutes: 9,
    intro: [
      'An AI agent is not a chatbot with extra steps. It holds credentials, takes actions, and makes decisions between human checkpoints. That changes what review has to establish.',
      'Reviewers who have seen agents go wrong tend to probe the same areas: what it can do unsupervised, whose identity it acts under, and how you stop it.',
    ],
    sections: [
      {
        h: 'Autonomy and blast radius',
        list: [
          'Which actions can the agent take without a human approving each one?',
          'Which actions are explicitly forbidden, and is that enforced technically or only by prompt?',
          'What is the worst realistic outcome of a single bad decision — and is that bounded by design?',
          'Are there rate limits or value thresholds above which a human must intervene?',
        ],
      },
      {
        h: 'Identity and permissions',
        list: [
          'Does the agent have its own identity, or is it borrowing a human\'s credentials? Borrowed identity destroys attribution and is a common blocker.',
          'Are its permissions scoped to the task, or did it inherit a broad service account?',
          'Can its actions be attributed unambiguously in logs after the fact?',
          'Does offboarding a person or project revoke the agent\'s access too?',
        ],
      },
      {
        h: 'Tools and connectors',
        list: [
          'Enumerate every tool, API, and data source the agent can call.',
          'For each, confirm the permission is the minimum required — read where read suffices.',
          'Confirm what the agent can see is what the *requesting user* is allowed to see, not what the agent is allowed to see. Permission trimming failures are the most common serious finding.',
          'Confirm behaviour when a tool call fails, and that failures cannot be retried unboundedly.',
        ],
      },
      {
        h: 'Containment and reversibility',
        list: [
          'Is there a kill switch, does someone specific own it, and has it been tested?',
          'Are the agent\'s actions reversible, and is there a documented rollback path?',
          'Is there a defined monitoring signal that would indicate misbehaviour, and who watches it?',
          'Is there an owner on call, or does the agent run unattended overnight?',
        ],
      },
      {
        h: 'Input and output integrity',
        list: [
          'Prompt injection exposure: can untrusted content reach the agent\'s context and influence its actions?',
          'Are outputs constrained and validated before they trigger downstream effects?',
          'Is sensitive data prevented from leaving through the agent — DLP applied to outputs, not just inputs?',
          'Are prompts and completions logged, and is that logging itself compliant with your retention and privacy commitments?',
        ],
      },
    ],
    takeaway:
      'The questions that decide agent approval are about identity, scope, and stopping power. Answer those four sections before review and you remove most of the reasons an agent gets blocked.',
  },
  {
    slug: 'go-no-go-decision',
    kind: 'Template',
    title: 'How to structure a go / no-go decision',
    dek: 'Most approvals fail as decisions, not as reviews — nobody stated what was being approved, under what conditions, or who owns the residual risk.',
    minutes: 7,
    intro: [
      'A surprising number of tool approvals end in ambiguity. The meeting happens, heads nod, the tool ships — and six months later nobody can say what was actually agreed or who accepted the risk.',
      'A decision record does not need to be long. It needs to be unambiguous about five things.',
    ],
    sections: [
      {
        h: 'The five things a decision must state',
        pairs: [
          { k: '1. What is being approved', v: 'The specific tool, version, environment, and user population. "Copilot for the pilot group of 40 in Finance" — not "Copilot".' },
          { k: '2. On what basis', v: 'The readiness score, the risk grade, and which lenses were reviewed. This is the evidence the decision rests on.' },
          { k: '3. Under what conditions', v: 'The constraints that make the yes valid: data classes permitted, scopes limited, controls that must remain in place.' },
          { k: '4. What risk is accepted', v: 'Residual risk stated plainly, and the named person accepting it. Risk accepted by "the committee" is risk accepted by nobody.' },
          { k: '5. When it is revisited', v: 'A date or a trigger — expansion beyond the pilot, a change in data scope, a vendor incident.' },
        ],
      },
      {
        h: 'Three outcomes, not two',
        body: [
          'Binary approve/reject forces reviewers into false choices and produces slow, defensive reviews. Three outcomes work better in practice:',
        ],
        list: [
          'Proceed — conditions documented, owner assigned, review date set.',
          'Proceed with conditions — approved for a narrower scope than requested, with the specific gap that must close before expansion.',
          'Do not proceed — with the named blocker and what would have to change. A rejection without a path is how teams learn to route around review entirely.',
        ],
      },
      {
        h: 'Who signs',
        body: [
          'Sign-off should map to the risk, not to the org chart. A low-risk internal tool does not need an executive; an autonomous agent touching customer data needs someone who can genuinely accept that exposure on behalf of the business.',
          'The practical test: if this went wrong publicly, is the person who signed the person who would be answering for it? If not, the wrong person signed.',
        ],
      },
      {
        h: 'Why writing it down changes behaviour',
        body: [
          'Recording conditions and an accepting owner changes the conversation more than any policy does. Vague enthusiasm gets specific fast when someone has to put their name against the residual risk.',
          'It also protects reviewers. A documented conditional approval is a defensible position; an undocumented verbal yes is not, and reviewers know it — which is part of why unclear processes run slowly.',
        ],
      },
    ],
    takeaway:
      'Name what is approved, on what basis, under what conditions, who accepts the residual risk, and when it is revisited. Five lines, and most approval ambiguity disappears.',
  },
];

export const GUIDE_BY_SLUG = Object.fromEntries(GUIDES.map((g) => [g.slug, g])) as Record<
  string,
  Guide
>;

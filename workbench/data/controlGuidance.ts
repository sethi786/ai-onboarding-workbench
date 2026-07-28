/**
 * What "done" actually means, for every control and every evidence item.
 *
 * A checkbox labelled "Kill switch" is not a review — it is a prompt to guess.
 * Two people will read it differently, tick it for different reasons, and the
 * readiness score built on top will be worth nothing. Each control here gets a
 * single concrete test a reviewer can apply and be wrong about only by lying;
 * each evidence item names where the artifact comes from, because "we couldn't
 * find it" is the most common reason evidence goes uncollected.
 *
 * Written to be checkable rather than aspirational: prefer "the vault path is
 * recorded and no credential appears in config" over "secrets are managed
 * securely". Coverage is enforced by a test — every id in teamLenses.ts must
 * appear here, so a new control cannot ship as a bare label.
 */

/** Control id -> the test for whether it is genuinely satisfied. */
export const CONTROL_GUIDANCE: Record<string, string> = {
  /* Business / Product */
  'biz-ctl-1':
    'A written business case has been approved by whoever controls the budget — not merely circulated for comment.',
  'biz-ctl-2':
    'A named executive has signed off in writing. "The CTO is supportive" is not a sign-off; a dated approval is.',
  'biz-ctl-3':
    'One named person owns the business outcome and will be asked about it in twelve months. Not a team, a person.',
  'biz-ctl-4':
    'A named product owner decides scope and priorities day to day, and users know who to ask.',
  'biz-ctl-5':
    'Success is stated as numbers with a baseline and a date — "cut contract review from 4 hours to 1 by Q3", not "improve efficiency".',
  'biz-ctl-6':
    'Money is allocated in a real cost centre for the full first year, including licences, usage, and the people who run it.',
  'biz-ctl-7':
    'You can say who gets access first, how they are trained, and what happens to the people who are not in the first wave.',
  'biz-ctl-8':
    'For every output that affects a client, money, or a legal position, a named human role is accountable for what the tool produced.',
  'biz-ctl-9':
    'Someone is scheduled to measure the KPIs after launch, on a date, and report the result — including if it failed.',

  /* AI Enablement / AI Program */
  'aie-ctl-1':
    'The request exists in the central AI intake log with a reference number, not only in an email thread.',
  'aie-ctl-2':
    'The tool has a row in the AI registry with owner, purpose, data used, and status — the record you would produce if a regulator asked what AI you run.',
  'aie-ctl-3':
    'You checked whether an already-approved tool does this job, and recorded why it does not.',
  'aie-ctl-4':
    'A short statement ties this use case to a stated AI objective, and names the objective.',
  'aie-ctl-5':
    'The choice of platform is written down with the alternatives considered and why they lost — so nobody re-litigates it in six months.',
  'aie-ctl-6':
    'The pilot has a defined end date and a decision rule stating what result leads to expansion, change, or shutdown.',
  'aie-ctl-7':
    'The current governance stage is visible to anyone who asks, without emailing the project team.',
  'aie-ctl-8':
    'A named AI owner is accountable for this tool in the registry and receives its recertification prompts.',

  /* Enterprise Architecture */
  'ea-ctl-1':
    'The architecture board reviewed it and the decision — approved, conditional, or rejected — is minuted.',
  'ea-ctl-2':
    'A target architecture document exists that a new engineer could read and understand what connects to what.',
  'ea-ctl-3':
    'Platform options were compared against stated criteria, and the comparison survives someone asking "why not the one we already own?".',
  'ea-ctl-4':
    'Build versus buy was assessed with real numbers on both sides, including the cost of maintaining a build.',
  'ea-ctl-5':
    'Every integration point is named, with its direction, protocol, and the system on the other end.',
  'ea-ctl-6':
    'Performance, availability, and scale targets are stated as numbers the platform team agreed they can meet.',
  'ea-ctl-7':
    'Deviations from your technology standards are listed and each has an accepted exception or a remediation date.',
  'ea-ctl-8':
    'You can state how you would get your data out and stand the capability up elsewhere, and roughly what that would cost.',

  /* Solution Architecture */
  'sa-ctl-1':
    'A solution design document describes components, data stores, and integrations at a level someone could build or review against.',
  'sa-ctl-2':
    'A data flow diagram shows every place data enters, rests, and leaves — including anything crossing outside the organization.',
  'sa-ctl-3':
    'Sequence diagrams cover the main path and at least one failure path.',
  'sa-ctl-4':
    'Every API this uses or exposes has a specification, with authentication and error responses documented.',
  'sa-ctl-5':
    'You have decided what the user sees when the model is unavailable, slow, or returns something unusable — and it is not a raw error.',
  'sa-ctl-6':
    'The events you will need in an incident are emitted and retained: requests, failures, latency, and who did what.',
  'sa-ctl-7':
    'The availability target is stated and the design supports it, including what happens when the vendor has an outage.',
  'sa-ctl-8':
    'A UAT plan names who tests, against which scenarios, and what result counts as a pass.',
  'sa-ctl-9':
    'The team that will support this after launch has agreed to take it, and knows what they are taking.',

  /* Security / SAR */
  'sar-ctl-1':
    'Access requires enterprise SSO with MFA enforced. Local accounts and shared logins are disabled, not merely discouraged.',
  'sar-ctl-2':
    'Roles are defined and each grants the minimum needed. Nobody has admin because it was easier during setup.',
  'sar-ctl-3':
    'Every credential lives in a secrets manager with a recorded path. No key, token, or password appears in config, code, or a spreadsheet.',
  'sar-ctl-4':
    'TLS in transit and encryption at rest are confirmed for every store, including caches, backups, and any vector index.',
  'sar-ctl-5':
    'Network access is restricted to what the tool needs — allowlists, private endpoints, or equivalent — and the rules are written down.',
  'sar-ctl-6':
    'Someone attempted prompt injection against this deployment and recorded what happened. Vendor claims are not a test.',
  'sar-ctl-7':
    'Jailbreak attempts were run against the guardrails in your configuration, and failures are logged with fixes or accepted risk.',
  'sar-ctl-8':
    'Content that a user can get into the index was tested for its ability to steer answers or exfiltrate data.',
  'sar-ctl-9':
    'Static, dynamic, and dependency scans run on every build, and the current findings are triaged rather than ignored.',
  'sar-ctl-10':
    'Any action the tool can take on its own is on an explicit allowlist, and destructive actions require a human.',
  'sar-ctl-11':
    'Somebody named can disable this within minutes, the method is documented, and it has been tried at least once.',
  'sar-ctl-12':
    'Security-relevant events reach your logging platform with enough retention to investigate an incident found late.',
  'sar-ctl-13':
    'This tool appears in the incident response plan: who is called, how it is isolated, and who tells the vendor.',

  /* Privacy / PIA */
  'pia-ctl-1':
    'A privacy impact assessment has been completed and reviewed by privacy — not started, completed.',
  'pia-ctl-2':
    'You can justify every category of personal data the tool touches. Anything you could not justify has been removed from scope.',
  'pia-ctl-3':
    'You know which countries the data is stored and processed in, including by subprocessors, and it is permitted.',
  'pia-ctl-4':
    'The retention period is stated and enforced by configuration, not by intention. Prompts, outputs, and logs each have one.',
  'pia-ctl-5':
    'Where consent or notice is required, the wording exists and covers this processing specifically.',
  'pia-ctl-6':
    'A deletion request can actually be fulfilled — including from caches, backups, and any vector index — and someone has confirmed how.',
  'pia-ctl-7':
    'Fields containing personal data are tagged in the data dictionary so downstream controls can act on them.',
  'pia-ctl-8':
    'Users and support staff know how to raise a privacy concern about this tool, and it reaches privacy.',

  /* Legal / OGC */
  'lgl-ctl-1':
    'Legal has read the vendor agreement — the current one, including anything incorporated by reference from a URL.',
  'lgl-ctl-2':
    'Client contracts were checked for terms this tool would breach, such as restrictions on processing, location, or subcontracting.',
  'lgl-ctl-3':
    'A data processing agreement is executed and covers this product and this data, not a different product from the same vendor.',
  'lgl-ctl-4':
    'Ownership of inputs and outputs is settled in writing, including whether your data trains the vendor’s models.',
  'lgl-ctl-5':
    'The subprocessor list has been reviewed and you receive notice before it changes.',
  'lgl-ctl-6':
    'Regulations that apply to this use — sectoral rules, the EU AI Act, and any regulator-specific obligations — have been identified.',
  'lgl-ctl-7':
    'Acceptable use is written for your staff in language they will actually follow, and says what not to put into the tool.',
  'lgl-ctl-8':
    'Legal has signed off in writing, with any conditions stated and assigned to someone.',

  /* QRM / Risk */
  'qrm-ctl-1':
    'A risk assessment covering this specific use case exists — not the vendor’s generic one, and not one written for a different tool.',
  'qrm-ctl-2':
    'The residual risk is written down and accepted by someone with the authority to accept it on the organization’s behalf.',
  'qrm-ctl-3':
    'For each consequential output, a human reviews before it is acted on, and that step is enforced rather than expected.',
  'qrm-ctl-4':
    'You have measured how often the tool is wrong on your own material and decided whether that rate is tolerable.',
  'qrm-ctl-5':
    'Where outcomes affect people — hiring, credit, access, assessment — you tested for disparate results and recorded them.',
  'qrm-ctl-6':
    'A named risk owner has signed, and would be the person answering if the risk materialised.',
  'qrm-ctl-7':
    'The accepted risks are in the risk register with review dates, not only in this assessment.',
  'qrm-ctl-8':
    'You have written the conditions under which you would stop using this tool, before you are under pressure to keep using it.',

  /* Data Governance */
  'dg-ctl-1':
    'Every data source the tool can reach is listed. If you cannot enumerate them, the review is not complete.',
  'dg-ctl-2':
    'The owner of each source has approved its use for this purpose. Access being technically possible is not approval.',
  'dg-ctl-3':
    'Sources carry classification labels, and the tool’s handling matches the highest classification it can reach.',
  'dg-ctl-4':
    'The tool honours existing permissions per user, and you verified it — because a tool that inherits over-shared access makes existing mistakes searchable.',
  'dg-ctl-5':
    'You know how content enters the index, how it is refreshed when the source changes, and how it is removed when the source is deleted.',
  'dg-ctl-6':
    'Metadata that controls access or retention travels with the content into the tool rather than being lost at ingestion.',
  'dg-ctl-7':
    'Someone has looked at whether the source data is accurate and current enough to answer from — stale sources produce confident wrong answers.',
  'dg-ctl-8':
    'The tool’s retention does not outlive the retention of the data it ingested.',

  /* IAM / Identity */
  'iam-ctl-1':
    'Authentication is federated through your identity provider. There is no separate password to reset.',
  'iam-ctl-2':
    'MFA and conditional access policies apply to this application specifically, and you confirmed it in policy, not by assumption.',
  'iam-ctl-3':
    'A role matrix maps each role to what it can see and do, and someone has checked it against what people actually need.',
  'iam-ctl-4':
    'Joiners, movers, and leavers flow automatically. A leaver loses access without anyone remembering to remove it.',
  'iam-ctl-5':
    'Every service principal or machine identity has a named human owner, a stated purpose, and an expiry.',
  'iam-ctl-6':
    'Each OAuth scope granted is justified in writing. Anything requested "for future use" has been removed.',
  'iam-ctl-7':
    'Access is reviewed on a schedule with a named reviewer, and the first review is booked.',
  'iam-ctl-8':
    'Admin and elevated access is a short list you can name from memory, and each entry is justified.',

  /* Platform / Cloud */
  'plt-ctl-1':
    'The deployment region is on your approved list and matches what privacy and legal signed off on.',
  'plt-ctl-2':
    'Development, test, and production are genuinely separate — separate data, separate credentials, no shared instance.',
  'plt-ctl-3':
    'The network design is documented: what is public, what is private, and what egress is permitted.',
  'plt-ctl-4':
    'Rate limits and quotas are known and raised where needed, so launch does not fail on a throttle nobody checked.',
  'plt-ctl-5':
    'Infrastructure is defined as code in a repository, so the environment can be rebuilt rather than remembered.',
  'plt-ctl-6':
    'Health, error rate, and latency are monitored, and someone receives the alerts.',
  'plt-ctl-7':
    'Backups exist, and a restore has been tested. An untested backup is a hope.',
  'plt-ctl-8':
    'A cost alert fires to a named person before spend becomes a finance conversation.',
  'plt-ctl-9':
    'A named platform team owns the infrastructure after launch and has accepted it.',

  /* DevSecOps / Secure SDLC */
  'sdl-ctl-1':
    'Deployments go through a pipeline. Nobody deploys from a laptop, including in an emergency.',
  'sdl-ctl-2':
    'The main branch cannot be pushed to directly, and the protection applies to administrators too.',
  'sdl-ctl-3':
    'Changes require review by someone other than the author, enforced by the platform.',
  'sdl-ctl-4':
    'Static, dynamic, and dependency scanning run automatically, and a failing scan blocks the release.',
  'sdl-ctl-5':
    'Secret scanning runs on commits and history, and any historical leak has been rotated — not just deleted.',
  'sdl-ctl-6':
    'Infrastructure code is scanned for misconfiguration before it is applied.',
  'sdl-ctl-7':
    'Automated tests cover the paths that matter, and they run before release rather than after an incident.',
  'sdl-ctl-8':
    'Prompts and model versions are versioned like code, so you can tell which prompt produced last month’s output.',
  'sdl-ctl-9':
    'Releases require an approval from someone other than the person releasing.',
  'sdl-ctl-10':
    'You can roll back to the previous version, the steps are written, and someone has done it once.',

  /* AI Engineering */
  'aien-ctl-1':
    'Prompts are stored in version control with history, not pasted into a console and lost.',
  'aien-ctl-2':
    'The system was evaluated against a dataset of your own realistic cases, with a recorded score — not judged by demo impressions.',
  'aien-ctl-3':
    'Retrieval quality was measured: does it find the right source, and does the answer follow the source it cites?',
  'aien-ctl-4':
    'You can see prompts, responses, latency, and errors in production, subject to your privacy rules.',
  'aien-ctl-5':
    'You know what happens when the vendor changes or retires the model, and who is notified.',
  'aien-ctl-6':
    'Token or request consumption is tracked against the forecast, so an unexpected spend is visible early.',
  'aien-ctl-7':
    'Users can report a bad output, and those reports reach the people who can change the prompt or the sources.',
  'aien-ctl-8':
    'A prompt or model change is re-run against the evaluation set before it ships, so an improvement cannot silently break something else.',

  /* Agent Governance */
  'ag-ctl-1':
    'The agent has an entry in your agent registry — the list you would produce if asked what autonomous software runs in your environment.',
  'ag-ctl-2':
    'A named human owns this agent’s behaviour and is accountable for what it does.',
  'ag-ctl-3':
    'The agent can call only an explicit list of tools and actions. Anything not listed is refused, not merely undocumented.',
  'ag-ctl-4':
    'Consequential actions — sending, paying, deleting, granting — require human confirmation, enforced in configuration.',
  'ag-ctl-5':
    'Every action the agent takes is logged with enough detail to reconstruct why it took it.',
  'ag-ctl-6':
    'The agent can be stopped immediately by a named person, and the stop has been tested.',
  'ag-ctl-7':
    'A support team knows this agent exists and what to do when it misbehaves at 2am.',
  'ag-ctl-8':
    'A recertification date is set at which the agent’s permissions and continued existence are re-approved.',

  /* Connector Governance */
  'cn-ctl-1':
    'Each connector is individually approved. "Connectors are enabled" is a configuration, not an approval.',
  'cn-ctl-2':
    'Each connector reaches only the sites, folders, or records it needs — not the whole tenant because that was the default.',
  'cn-ctl-3':
    'Data loss prevention policies apply to what moves through the connector, and you confirmed they are in effect.',
  'cn-ctl-4':
    'Granted OAuth scopes were reviewed one by one, and write scopes are justified rather than accepted with the bundle.',
  'cn-ctl-5':
    'Connector credentials are in a vault with rotation, owned by a service account rather than a person who may leave.',
  'cn-ctl-6':
    'Connector activity is logged, so you can answer "what did it read?" after the fact.',
  'cn-ctl-7':
    'There is a process to review and remove connectors nobody uses any more.',
  'cn-ctl-8':
    'A date is set to re-approve each connector’s scope, with a named reviewer.',

  /* Operations / Support */
  'ops-ctl-1':
    'A named team answers tickets for this tool, and users can find how to reach them.',
  'ops-ctl-2':
    'A runbook covers the failures you expect, written so someone on call at night can follow it without the project team.',
  'ops-ctl-3':
    'Incidents involving this tool have a defined path: who is paged, who decides to disable it, who contacts the vendor.',
  'ops-ctl-4':
    'Availability and errors are monitored continuously, not checked when someone complains.',
  'ops-ctl-5':
    'Alerts route to a rota that is actually staffed, and the thresholds have been tuned enough that people still read them.',
  'ops-ctl-6':
    'Service levels are agreed and written down — both what you offer users and what the vendor offers you.',
  'ops-ctl-7':
    'Changes to this tool follow your change process, including vendor-pushed updates you do not control.',
  'ops-ctl-8':
    'Users have a route to report problems and see that reports lead to changes.',
  'ops-ctl-9':
    'The first weeks after launch have named people with extra availability, and an end date for that arrangement.',

  /* Adoption / Training */
  'adp-ctl-1':
    'Training exists, is specific to this tool and these users, and is scheduled before access is granted.',
  'adp-ctl-2':
    'Users attest to the acceptable use terms, and the attestation is recorded per user.',
  'adp-ctl-3':
    'A starter set of known-good prompts or workflows exists, so users do not each discover the tool alone.',
  'adp-ctl-4':
    'A user guide covers what the tool is for, what it is not for, and what to do when it is wrong.',
  'adp-ctl-5':
    'A communications plan says who is told what and when, including the people not getting access yet.',
  'adp-ctl-6':
    'Champions are named in each affected team, and they know they are champions.',
  'adp-ctl-7':
    'You can measure who is actually using it, and the measure is in place before launch rather than after.',
  'adp-ctl-8':
    'User feedback is collected on a schedule and reaches whoever can act on it.',

  /* Vendor / Third-Party Risk */
  'vnd-ctl-1':
    'A third-party risk assessment has been completed for this vendor and this product, and the findings are triaged.',
  'vnd-ctl-2':
    'You read the scope section of the SOC 2 or ISO report and confirmed it covers the system you are buying — reports frequently exclude the newest product.',
  'vnd-ctl-3':
    'A data processing agreement is signed and current.',
  'vnd-ctl-4':
    'The subprocessor list is known, reviewed, and you get notice of changes with a right to object.',
  'vnd-ctl-5':
    'You have some basis for believing the vendor will exist in three years, proportionate to how hard they would be to replace.',
  'vnd-ctl-6':
    'You know how to export your data and what you would lose, before you need to.',
  'vnd-ctl-7':
    'Procurement or vendor management has formally approved this vendor.',

  /* Finance / FinOps / Cost */
  'fin-ctl-1':
    'The budget is approved in a real cost centre for a stated period, by someone who can approve it.',
  'fin-ctl-2':
    'Total cost includes licences, usage, infrastructure, and the people who run and support it — not just the licence line.',
  'fin-ctl-3':
    'A forecast exists with stated assumptions about users and usage, so a variance can be explained.',
  'fin-ctl-4':
    'Actual spend is visible to the owner without asking finance for a report.',
  'fin-ctl-5':
    'A cost alert fires to a named person at a threshold agreed in advance.',
  'fin-ctl-6':
    'How the cost is allocated to consuming teams is decided, even if the decision is "central for now".',
  'fin-ctl-7':
    'One named person is accountable for this spend.',
  'fin-ctl-8':
    'There is a decided path for approving overage before it happens, rather than discovering it on an invoice.',

  /* Go / No-Go */
  'gng-ctl-1':
    'Every required review team has signed, with names and dates, in one place.',
  'gng-ctl-2':
    'Outstanding risks are listed and accepted in writing by someone empowered to accept them.',
  'gng-ctl-3':
    'A change or release ticket exists and references this review.',
  'gng-ctl-4':
    'The rollback plan is written, and rolling back does not depend on one person being reachable.',
  'gng-ctl-5':
    'A launch checklist exists with owners against each item, and it has been walked through.',
  'gng-ctl-6':
    'Enhanced support for the first weeks is staffed and has an end date.',
  'gng-ctl-7':
    'You know what you will watch in the first week and what result would make you stop.',
  'gng-ctl-8':
    'The go/no-go decision, its conditions, and who was present are minuted.',
};

/** Evidence id -> where the artifact comes from and what makes it acceptable. */
export const EVIDENCE_GUIDANCE: Record<string, string> = {
  /* Business / Product */
  'biz-e1': 'The approved business case, as submitted for funding.',
  'biz-e2': 'The project charter naming scope, owners, and sponsor.',
  'biz-e3': 'A short statement of what the tool will be used for, in the users’ words.',
  'biz-e4': 'A mock or live view of how the success metrics will be reported.',
  'biz-e5': 'The list or group definition of who gets access in the first wave.',
  'biz-e6': 'Costs against expected benefit, with the assumptions shown.',
  'biz-e7': 'A responsibility matrix naming who is accountable, consulted, and informed.',
  'biz-e8': 'Dated approvals from the sponsor and business owner.',
  'biz-e9': 'When and how value will be measured after launch, and by whom.',

  /* AI Enablement / AI Program */
  'aie-e1': 'The submitted AI intake form with its reference number.',
  'aie-e2': 'The registry record as it appears in the AI inventory.',
  'aie-e3': 'The comparison of platform options against your criteria.',
  'aie-e4': 'The log of governance decisions taken so far, with dates.',
  'aie-e5': 'The pilot charter: scope, duration, users, and the decision rule at the end.',
  'aie-e6': 'The recorded approval of this use case by the AI programme.',
  'aie-e7': 'A short note tying this to a stated AI objective.',

  /* Enterprise Architecture */
  'ea-e1': 'The target architecture document, current version.',
  'ea-e2': 'Component and integration diagrams from the design.',
  'ea-e3': 'The deck presented to the architecture board.',
  'ea-e4': 'The platform options comparison, if not already in the TAD.',
  'ea-e5': 'A map of every system this integrates with and in which direction.',
  'ea-e6': 'Performance, availability, and scale requirements as agreed numbers.',
  'ea-e7': 'Architecture decisions with their rationale and alternatives.',
  'ea-e8': 'How you would extract data and move to an alternative, with rough effort.',

  /* Solution Architecture */
  'sa-e1': 'The solution design document, current version.',
  'sa-e2': 'Sequence diagrams for the main path and a failure path.',
  'sa-e3': 'The data flow diagram — Aegis generates one from this evaluation you can start from.',
  'sa-e4': 'API specifications for what this consumes and exposes.',
  'sa-e5': 'How prompts are constructed, including what context is injected.',
  'sa-e6': 'What the user sees and what is logged when things fail.',
  'sa-e7': 'What is monitored, at what threshold, alerting whom.',
  'sa-e8': 'Signed-off user acceptance test results.',
  'sa-e9': 'The agreement with the team taking over support, and what they received.',

  /* Security / SAR */
  'sar-e1': 'The completed security assessment report — Aegis drafts one from this evaluation.',
  'sar-e2': 'The threat model: what an attacker would target and what stops them.',
  'sar-e3': 'Data flow showing everything crossing a trust boundary.',
  'sar-e4': 'Network topology including ingress, egress, and private connectivity.',
  'sar-e5': 'The role-to-permission matrix as configured.',
  'sar-e6': 'A screenshot or config extract showing credentials resolve from the vault.',
  'sar-e7': 'Confirmation of TLS and at-rest encryption for each store.',
  'sar-e8': 'What you attempted, what the tool did, and what you changed as a result.',
  'sar-e9': 'The current scan output with findings triaged.',
  'sar-e10': 'The penetration test report and the remediation status of its findings.',
  'sar-e11': 'Which security events are captured, where they go, and for how long.',
  'sar-e12': 'The runbook for an incident involving this tool.',

  /* Privacy / PIA */
  'pia-e1': 'The completed and reviewed privacy impact assessment.',
  'pia-e2': 'What personal data is in scope, by category and source.',
  'pia-e3': 'The data dictionary with personal-data fields tagged.',
  'pia-e4': 'Where data goes from collection to deletion, including backups.',
  'pia-e5': 'The retention period for prompts, outputs, and logs, and how it is enforced.',
  'pia-e6': 'The steps to fulfil a deletion request, including the vector index.',
  'pia-e7': 'The executed DPA and the vendor’s subprocessor list.',
  'pia-e8': 'Privacy’s dated sign-off, with any conditions.',

  /* Legal / OGC */
  'lgl-e1': 'Legal’s written opinion on this arrangement.',
  'lgl-e2': 'The executed vendor agreement, including anything incorporated by reference.',
  'lgl-e3': 'The signed data processing agreement.',
  'lgl-e4': 'The vendor’s current subprocessor list.',
  'lgl-e5': 'Which client contracts restrict this processing, and how.',
  'lgl-e6': 'The position on ownership of inputs, outputs, and training use.',
  'lgl-e7': 'The acceptable use terms your staff will attest to.',
  'lgl-e8': 'Any negotiated exceptions to standard terms, and who accepted them.',

  /* QRM / Risk */
  'qrm-e1': 'The risk assessment for this specific use case.',
  'qrm-e2': 'The residual risk statement and who accepted it.',
  'qrm-e3': 'How human review works in practice, and where it is enforced.',
  'qrm-e4': 'How often the tool was right on your own test cases, and against what standard.',
  'qrm-e5': 'Fairness testing results across the groups the outcome affects.',
  'qrm-e6': 'The risk owner’s dated signature.',
  'qrm-e7': 'The register entries created for accepted risks, with review dates.',
  'qrm-e8': 'What the worst realistic failure would cost, and whether you could absorb it.',

  /* Data Governance */
  'dg-e1': 'Every data source the tool can reach, enumerated.',
  'dg-e2': 'How data moves from source into the tool and out again.',
  'dg-e3': 'How the tool’s access maps to existing permissions, per user.',
  'dg-e4': 'How index content is created, refreshed, and deleted when the source changes.',
  'dg-e5': 'Dated approval from each data owner for this use.',
  'dg-e6': 'Whether the source data is accurate and current enough to answer from.',
  'dg-e7': 'Which classification each source carries and how the tool handles it.',
  'dg-e8': 'How answers cite their sources, so a user can check them.',

  /* IAM / Identity */
  'iam-e1': 'How authentication flows from user to tool, including any brokers.',
  'iam-e2': 'The role-to-permission matrix as configured.',
  'iam-e3': 'Which directory groups map to which roles.',
  'iam-e4': 'The application registration, its permissions, and its owner.',
  'iam-e5': 'The provisioning configuration and what it does on a leaver.',
  'iam-e6': 'The most recent access review with reviewer and date.',
  'iam-e7': 'The joiner, mover, leaver procedure as it applies to this tool.',
  'iam-e8': 'Each granted OAuth scope with a one-line justification.',

  /* Platform / Cloud */
  'plt-e1': 'The cloud architecture as deployed, including region.',
  'plt-e2': 'Network topology with ingress, egress, and private endpoints.',
  'plt-e3': 'A link to the infrastructure-as-code repository.',
  'plt-e4': 'Confirmation that quotas and rate limits cover expected load.',
  'plt-e5': 'The infrastructure cost estimate with assumptions.',
  'plt-e6': 'The disaster recovery plan and the date of the last tested restore.',
  'plt-e7': 'What is monitored, at what threshold, alerting whom.',
  'plt-e8': 'How development, test, and production are separated.',

  /* DevSecOps / Secure SDLC */
  'sdl-e1': 'The pipeline definition showing the gates that run.',
  'sdl-e2': 'Current static, dynamic, and dependency scan output.',
  'sdl-e3': 'Test results from the most recent release.',
  'sdl-e4': 'The release plan and its approvals.',
  'sdl-e5': 'Prompt version history from source control.',
  'sdl-e6': 'Which model version is in production and when it changed.',
  'sdl-e7': 'The change ticket for the go-live.',
  'sdl-e8': 'The rollback procedure, with who can execute it.',

  /* AI Engineering */
  'aien-e1': 'The prompts in use, with version history.',
  'aien-e2': 'Evaluation scores against your test set, and the standard you set.',
  'aien-e3': 'The test cases you evaluate against — realistic examples from your own work.',
  'aien-e4': 'Retrieval quality results: right source found, answer grounded in it.',
  'aien-e5': 'The dashboard showing prompts, latency, errors, and volume in production.',
  'aien-e6': 'Why this model was chosen and what the alternatives were.',
  'aien-e7': 'Expected token or request consumption, and the assumptions behind it.',
  'aien-e8': 'What happens when the vendor changes or deprecates the model.',

  /* Agent Governance */
  'ag-e1': 'The agent’s configuration as deployed, including its instructions.',
  'ag-e2': 'Every tool and action the agent can invoke.',
  'ag-e3': 'Which identity the agent acts as, and what that identity can reach.',
  'ag-e4': 'Evidence the kill switch was tested, with the date.',
  'ag-e5': 'Results of testing the agent against its intended and unintended behaviours.',
  'ag-e6': 'The agent’s entry in the registry.',
  'ag-e7': 'Who supports this agent and how they are reached.',
  'ag-e8': 'The approval to publish the agent to its intended audience.',

  /* Connector Governance */
  'cn-e1': 'Which connectors are enabled and what each reaches.',
  'cn-e2': 'Each granted OAuth scope with a one-line justification.',
  'cn-e3': 'The data loss prevention policies in effect on this path.',
  'cn-e4': 'How the connector authenticates and where the credential lives.',
  'cn-e5': 'Approval for any third-party connector, from vendor risk.',
  'cn-e6': 'Precisely which sites, folders, or records are in scope.',
  'cn-e7': 'How connectors are reviewed, recertified, and removed.',

  /* Operations / Support */
  'ops-e1': 'The runbook for the failures you expect.',
  'ops-e2': 'The service levels you offer users and the vendor offers you.',
  'ops-e3': 'The alert rules as configured, with their destinations.',
  'ops-e4': 'Who is contacted, in what order, when something breaks.',
  'ops-e5': 'The incident procedure specific to this tool.',
  'ops-e6': 'What users are given to help themselves.',
  'ops-e7': 'Known limitations and defects users should be told about.',
  'ops-e8': 'Who provides enhanced support after launch, and until when.',

  /* Adoption / Training */
  'adp-e1': 'The training material users will actually receive.',
  'adp-e2': 'Per-user records of acceptable use attestation.',
  'adp-e3': 'The user guide, including what the tool should not be used for.',
  'adp-e4': 'The starter prompts or workflows given to users.',
  'adp-e5': 'The announcements and their timing.',
  'adp-e6': 'How usage is measured and where it is reported.',
  'adp-e7': 'Answers to the questions users are going to ask anyway.',
  'adp-e8': 'Who the champions are and what they have agreed to do.',

  /* Vendor / Third-Party Risk */
  'vnd-e1': 'The vendor’s completed security questionnaire.',
  'vnd-e2': 'The SOC 2 or ISO report — check the scope section covers this product.',
  'vnd-e3': 'The signed data processing agreement.',
  'vnd-e4': 'The current subprocessor list and your notice rights.',
  'vnd-e5': 'How you would extract your data and what you would lose.',
  'vnd-e6': 'Procurement or vendor management’s recorded approval.',
  'vnd-e7': 'The vendor’s committed support response and resolution times.',

  /* Finance / FinOps / Cost */
  'fin-e1': 'The approved budget line, with cost centre and period.',
  'fin-e2': 'Total cost of ownership including people, not only licences.',
  'fin-e3': 'Where actual spend is visible to the owner.',
  'fin-e4': 'The alert thresholds and who receives them.',
  'fin-e5': 'How cost is allocated to consuming teams.',
  'fin-e6': 'The usage assumptions behind the forecast, so a variance can be explained.',
  'fin-e7': 'The cost centre owner’s approval.',

  /* Go / No-Go */
  'gng-e1': 'Every required team’s sign-off, with names and dates.',
  'gng-e2': 'The minuted decision, its conditions, and who attended.',
  'gng-e3': 'The signed acceptance of outstanding risks.',
  'gng-e4': 'The authorization to release to production.',
  'gng-e5': 'The rollback procedure and who can execute it.',
  'gng-e6': 'Signed-off user acceptance test results.',
  'gng-e7': 'Confirmation the support team is ready and staffed.',
  'gng-e8': 'Evidence that first-wave users completed training.',
};

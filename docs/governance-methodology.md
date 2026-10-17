# Aegis readiness methodology 2.0

This is an internal self-assessment rubric, not an industry benchmark percentile,
certification, vulnerability scan, or permission to deploy. Controls and decisions
are self-reported. Evidence references are checked for scope, association, expiry,
and URL format; their contents are not fetched or independently verified.

## Progress and gates

Each applicable team retains its configured weight from `workbench/data/teamLenses.ts`.
Missing required assessments stay in the denominator. Optional teams do not change
the overall score or block the required review scope.

For a current-scope assessment with an integer self-score from 0 to 5:

```
completeness = (completed controls + supported evidence) / (required controls + required evidence)
team progress = round((self-score / 5) × 100 × (0.5 + 0.5 × completeness))
overall progress = round(sum(team progress × weight) / sum(required team weights))
```

An unset, invalid, or earlier-scope self-score contributes zero. A critical blocker
blocks the recommendation but preserves the progress score, so completed work stays
visible. Autonomous action risk is at least High; autonomy involving personal,
client, confidential, or restricted data is Critical.

To be ready for review, every required team needs current scope confirmation,
all required controls, current evidence for every requirement, no open blockers
or remediation flags, and at least 80% team progress. Missing any prerequisite
prevents a Proceed recommendation, even when the weighted score is high.
The numeric recommendation then distinguishes Proceed (at least 85 with Low or
Medium risk) from Proceed with Conditions (at least 70). Neither is formal approval.

The separate self-reported decision status only shows Approved when every required
team is ready and explicitly records Approved. Any conditional decision makes the
aggregate conditional. The system does not authenticate an independent reviewer,
enforce separation of duties, or replace the organization's approval system.

## Evidence and scope

An evidence item counts only when its checkbox is checked and it has an HTTP(S)
reference linked to that exact requirement and the current scope revision. URLs
containing embedded credentials are rejected. Expiry is optional; when supplied,
it is inclusive through that UTC date. Links are never fetched by the server.

Profile changes other than display name and status increment a database-controlled
scope revision. Earlier assessments, notes, and links remain saved, but do not earn
current readiness credit. Review the answers and explicitly confirm the current
scope; that confirmation resets a prior Approved or Approved with Conditions decision
to Not Reviewed while retaining blocked and remediation decisions. Reattach
evidence against the new scope. Editing notes alone never revalidates old evidence.
Previous blockers remain open until explicitly resolved.

New assessments also require explicit scope confirmation. Attaching a reference
from an outdated page is rejected until the current scope is reloaded.

The dashboard, CSV, JSON, reports, and draft artifacts use the same scoring engine.
JSON exports use schema version 2 and include methodology, timestamp, and score
details. There is no supported profile-import workflow; exported data is not trusted
as an authorization or approval record. The public demo uses labeled synthetic data.

## Upgrade and verification

Apply `supabase/migrations/0006_governance_integrity.sql` after migrations 0001–0005
and **before deploying this application version**. It is transactional and keeps
existing assessments and evidence. Legacy assessments start at revision 0 and
legacy references remain unassigned, so users must review scope and attach item-level
references before those records count toward readiness. Scores can decrease on
upgrade for this reason. Missing workflow stages are backfilled without overwriting
existing stages; new evaluations create their stages in the same transaction.

New database constraints are `NOT VALID` to retain legacy data for correction.
They enforce valid scores, decisions, map structure, and URL formats on new writes
and updates. A legacy invalid row must be corrected before it can be edited.
Identity and parent changes are rejected even for users who can access both tenants.
Catalogue keys and complete runtime payload validation are enforced in server actions;
the scoring engine ignores unknown catalogue IDs in stored data.

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
Tests cover scoring and report regression cases, UI save failures and rapid field
edits, action authorization, and the actual SQL migrations/triggers/RLS in an
embedded Postgres instance. The SQL tests provide a minimal auth schema and role
to exercise policies; they do not exercise Supabase Auth cookies or PostgREST.

Before release, use a configured Supabase staging project to verify owner/member/
viewer sign-in, create an evaluation, save an assessment and reference, reload,
change scope, confirm the review again, and download the report. Live credentials
were not available in the development environment, so that signed-in end-to-end
check and application of the migration to a hosted project remain release steps.

## Dependency checks

The reviewed lockfile uses Next.js 15.5.28, Supabase JS 2.50.0 (Auth JS 2.70.0),
and Vitest 4.1.11. A narrowly scoped npm override supplies PostCSS 8.5.23 to Next.js
to address its vulnerable transitive version. Production audit returned zero known
vulnerabilities on 2026-10-17; this is a point-in-time dependency check, not a security
certification. The production build succeeds with an upstream Supabase Realtime
dynamic-import bundling warning; live auth/session validation remains required.

The full development audit still reports five entries in one dependency chain:
`eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`.
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) has no patched
braces release at review time. This chain is used by lint tooling, not production
dependencies. Keep lint patterns controlled by the repository and update the chain
when upstream provides a fix; do not downgrade the application framework merely to
silence the audit report.

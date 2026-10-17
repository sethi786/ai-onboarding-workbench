# Aegis

**Get AI tools cleared for the enterprise.** Aegis is a premium, multi-tenant B2B SaaS for
onboarding AI tools, agents, RAG apps, and connectors through enterprise review. Teams self-evaluate
against **20 enterprise review lenses**, track controls/evidence/blockers, get a readiness score, risk
grade, and go/no-go recommendation, and generate draft evidence packs — **before** formal review.

> Aegis is a self-evaluation and readiness aid. It does not replace official enterprise approval
> workflows. Final decisions follow your organization's formal governance processes.

## What's inside

- **Marketing site** (`app/(marketing)`) — SSG, SEO-friendly: Home, Services, Assessment, Resources,
  About, Contact, Book, Privacy, Terms. Premium dark-navy / electric-blue "control tower" brand.
- **Auth** (`app/(auth)` + `app/auth/*`) — Supabase Auth: signup, login, forgot/reset password, email
  confirm, OAuth-ready callback.
- **Multi-tenant client portal** (`app/portal/[orgSlug]`) — organizations, members, roles
  (owner/admin/member/viewer), strict tenant isolation via Postgres **RLS**, org switcher.
  - Governance Control Tower dashboard, Evaluations, 20-lens Self-Evaluation, 25-stage Workflow,
    Approvals matrix, Evidence Factory (20 draft artifacts), Exports, Platform Matrix, Settings.
- **Prefilled AI-tool library** (`data/tool-templates.ts`) — ~15 major tools (ChatGPT Enterprise,
  Copilot, Copilot Studio, Gemini, Claude, Azure AI Foundry, Vertex, Bedrock, Codex, Replit, GitHub
  Copilot, Glean, Perplexity, Cursor, …) instantiated into an org as pre-populated evaluations.

## Tech stack

Next.js (App Router) · TypeScript (strict) · Tailwind v4 · Supabase (Auth + Postgres + RLS) ·
server components + server actions. The framework-agnostic scoring engine, exports, 20-lens data, and
types live in `workbench/` — the engine never touches Supabase. Read the
[versioned governance methodology](docs/governance-methodology.md) for scoring,
evidence validity, scope changes, and the distinction between readiness and approval.

## Project structure

```
app/(marketing)   public marketing pages
app/(auth)        login / signup / password reset
app/auth/*        OAuth/magic-link callback + signout route handlers
app/portal/*      authenticated, org-scoped client portal
workbench/*       pure scoring engine, export builders, 20-lens data, types
lib/supabase/*    @supabase/ssr server + browser + middleware + admin (service-role, scripts only)
lib/auth/*        requireUser, requireMembership
lib/db/*          typed schema, mappers (row ↔ domain), queries, scoreEvaluation
lib/actions/*     server actions (replace the old Zustand store)
components/*       brand, ui primitives, marketing, portal, auth
data/tool-templates.ts   prefilled library
supabase/migrations/*    schema, functions, triggers, RLS
scripts/seed-templates.ts  optional: seed tool_templates table (service role)
```

## Local development

Use Node.js 22.12 or newer for the development and test tools.

```bash
npm install
npm run dev        # http://localhost:3000  (marketing works with no backend)
npm run build      # production build (succeeds without a live Supabase project)
npm test           # scoring, reports, actions, UI saves, and Postgres/RLS regression tests
npm run typecheck
```

The **marketing site runs with no backend**. The portal requires Supabase (below).

## Supabase setup (to enable auth + the portal)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy env: `cp .env.example .env.local` and fill in from **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server/scripts only — never exposed to the browser)
   - `NEXT_PUBLIC_SITE_URL` (e.g. `http://localhost:3000`)
3. Apply the schema — run the migrations **in order** in the Supabase SQL editor
   (or via the Supabase CLI: `supabase db push`):
   ```
   supabase/migrations/0001_init.sql
   supabase/migrations/0002_functions.sql
   supabase/migrations/0003_triggers.sql
   supabase/migrations/0004_rls.sql
   supabase/migrations/0005_tool_category.sql
   supabase/migrations/0006_governance_integrity.sql
   supabase/migrations/0007_launch_commerce.sql
   supabase/migrations/0008_workspace_operations.sql
   supabase/migrations/0009_database_access.sql
   ```
4. Configure email confirmation, custom SMTP, allowed callback URLs and the supplied confirmation/recovery templates using [Authentication setup](docs/authentication-setup.md). Production public environment changes require a new build.
5. (Optional) Seed the tool-template table: `npm run seed:templates`. The library also renders from the
   static module, so this is only needed if you later query/extend templates in the DB.
6. `npm run dev`, sign up, create a workspace, and start an evaluation.

For existing installations, back up first and apply only unapplied migrations through 0009 before deploying this version.
Existing notes and links are retained; earlier assessments and unassigned legacy
references require review before they contribute to readiness. See the methodology
document for upgrade behavior and staging verification steps.

> To regenerate DB types after schema changes with the Supabase CLI: `npm run gen:types` (overwrites
> `lib/db/types.ts`, currently hand-authored to match the migrations).

## Multi-tenancy & security

- Every tenant table carries `org_id`; **RLS** restricts reads to org members and writes to
  role-appropriate members. Helpers `auth_org_ids()` / `has_org_role()` are `SECURITY DEFINER`.
- Orgs are created via the `create_organization` RPC (atomic org + owner membership) to avoid the
  RLS insert chicken-and-egg.
- Auth decisions always use `getUser()` (verifies the JWT); the session is refreshed in `middleware.ts`.
- The seed client (`lib/supabase/admin.ts`) is ESLint-fenced to `scripts/` only. A separate
  server-only service client is used by verified billing and validated lead handlers.

## Remaining product roadmap

SSO/SCIM, custom lens authoring, independent signed approval records, live vendor monitoring,
and richer analytics are not part of the current release.

## Commercial launch release

The launch release adds a public 40-tool catalogue, six assessment starters, US$99/month Team pricing,
Stripe-hosted checkout and billing management, signed webhook reconciliation, persistent enquiry
intake with Turnstile, and expiring shareable workspace invitations. Starter includes three evaluations,
one member, and exports. Every template starts unreviewed.

Apply **`supabase/migrations/0007_launch_commerce.sql`** after the governance-integrity migration.
It protects billing fields, enforces database quotas, restricts membership management, and adds
invitation, lead-intake and billing RPCs. Public API clients cannot execute service-only RPCs.

Read **[the customer audit and launch runbook](docs/launch-readiness.md)** before opening sales.
`LAUNCH_APPROVED=false` is the default. Missing services show an honest preview/unavailable state.
No domain or paid infrastructure is purchased by this change; production legal terms and real provider
acceptance tests remain deployment gates. Keep credentials out of git and client-side environment variables.

Verification: `npm test`, `npm run typecheck`, `npm run lint`, `npm audit --omit=dev`, `npm run build`.
For the isolated no-credentials HTTP smoke suite, start the production build on port 3001 and run
`npm run test:smoke -- http://localhost:3001`. The checked-in CI workflow runs these checks on PRs.

## Workspace operations release

Migration `0008_workspace_operations.sql` adds tenant-scoped activity history, a manager-only member directory, workspace name validation, review recency updates, hardened function search paths, and protection against orphaning billing when a workspace is deleted through the API. The application adds owner-controlled member access changes, editable workspace names, portfolio search/filters, overdue-review indicators, mobile review forms, navigation/save guards, and the public `/demo` route.

`npm run build` now clears generated `.next` output before rebuilding, including stale route-cache entries. Do not run a build in the same working directory as a production server that must stay online; deployments should use a fresh checkout/build directory.

Activity records begin when migration 0008 is applied. They contain field names and actor/record identifiers, not before/after notes, evidence documents, or invitation tokens. Application users cannot edit the history; authorized database operators manage retention. Configure and verify the retention policy before launch.

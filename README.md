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
types are ported **verbatim** into `workbench/` and reused unchanged — the engine never touches Supabase.

## Project structure

```
app/(marketing)   public marketing pages
app/(auth)        login / signup / password reset
app/auth/*        OAuth/magic-link callback + signout route handlers
app/portal/*      authenticated, org-scoped client portal
workbench/*       ported pure engine, export builders, 20-lens data, types (unchanged)
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

```bash
npm install
npm run dev        # http://localhost:3000  (marketing works with no backend)
npm run build      # production build (succeeds without a live Supabase project)
npm test           # ported scoring-engine unit tests (Vitest)
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
   ```
4. In **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback` (and your prod
   URL) as a redirect URL.
5. (Optional) Seed the tool-template table: `npm run seed:templates`. The library also renders from the
   static module, so this is only needed if you later query/extend templates in the DB.
6. `npm run dev`, sign up, create a workspace, and start an evaluation.

> To regenerate DB types after schema changes with the Supabase CLI: `npm run gen:types` (overwrites
> `lib/db/types.ts`, currently hand-authored to match the migrations).

## Multi-tenancy & security

- Every tenant table carries `org_id`; **RLS** restricts reads to org members and writes to
  role-appropriate members. Helpers `auth_org_ids()` / `has_org_role()` are `SECURITY DEFINER`.
- Orgs are created via the `create_organization` RPC (atomic org + owner membership) to avoid the
  RLS insert chicken-and-egg.
- Auth decisions always use `getUser()` (verifies the JWT); the session is refreshed in `middleware.ts`.
- The service-role client (`lib/supabase/admin.ts`) is ESLint-fenced to `scripts/` only.

## Roadmap (post-foundation)

Stripe billing (schema seam already present: `organizations.stripe_customer_id` / `plan`), invitation
acceptance flow, richer analytics, and a larger prefilled tool library.

# Aegis

**Govern every tool you adopt.** Aegis is a multi-tenant B2B SaaS for taking a tool — SaaS, cloud
service, on-premise software, AI system, or internal build — through enterprise review. Teams
self-evaluate against **20 review lenses**, track controls, evidence, and blockers, get a readiness
score, risk grade, and go/no-go recommendation, and generate branded evidence packs, diagrams, and a
print-ready review document — **before** formal review.

Review scope is derived, not assumed: AI-specific lenses are skipped for tools with no AI
capability, and build/hardening lenses are skipped for software you neither build nor host.

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
lib/ai/*          Anthropic client, prompts, and the four assist functions (server only)
lib/branding.ts   workspace branding resolution + validation
workbench/diagrams/*  generated SVG + Mermaid diagrams (pure, no dependencies)
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
   supabase/migrations/0005_tool_category.sql
   supabase/migrations/0006_accept_invitation.sql
   supabase/migrations/0007_branding.sql
   supabase/migrations/0008_audit_and_ai_governance.sql
   supabase/migrations/0009_separation_of_duties.sql
   supabase/migrations/0010_control_assurance.sql
   ```
4. In **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback` (and your prod
   URL) as a redirect URL.
5. (Optional) Seed the tool-template table: `npm run seed:templates`. The library also renders from the
   static module, so this is only needed if you later query/extend templates in the DB.
6. `npm run dev`, sign up, create a workspace, and start an evaluation.

> To regenerate DB types after schema changes with the Supabase CLI: `npm run gen:types` (overwrites
> `lib/db/types.ts`, currently hand-authored to match the migrations).

## AI assistance (optional)

Set `ANTHROPIC_API_KEY` and the assistant appears at four points in the workflow:

| Where | What it does |
|---|---|
| New evaluation | Reads a pasted vendor page or request email and fills the intake form, with its reasoning and an explicit list of what it couldn't determine |
| Each review lens | Drafts that team's narrative and residual risk, flags which controls the intake data supports, and lists the questions to put to the vendor |
| Exports | Writes the executive summary that opens the review pack |
| Exports | Answers a reviewer's or customer's question from the recorded assessment, labelled with how well the assessment actually supports it |

Nothing is applied silently — every draft is reviewed and inserted by a human, and control
suggestions are shown as claims to verify rather than ticked for you. **Leave the key unset and the
product works exactly as before**: each AI affordance renders an explicit "unavailable" state.

## Branding & document generation

Workspace branding (legal name, logo, colour, handling marking, footer) is set in
**Settings → Organization** and stamped onto every artifact — the markdown evidence packs, the
exports, and the print-ready HTML review document, which the browser turns into a PDF with no PDF
dependency.

Four diagrams are generated from the evaluation's own answers (data flow, trust boundary, approval
path, readiness heatmap) as inline SVG and as Mermaid source. Because they're derived rather than
drawn, they can't drift from the assessment they describe.

## Audit trail & AI governance

Every action that changes a review is recorded: who, what, when. The table is
**append-only at the database level** — there is deliberately no UPDATE or
DELETE policy, and both are revoked from the `authenticated` role, because a
trail the actors can rewrite is not evidence. Members read their own
workspace's trail at **Settings → Audit trail** and export it as CSV.

AI is governed per workspace at **Settings → Organization**:

| Control | Behaviour |
|---|---|
| Off switch | Enforced server-side. Every AI action is refused and the refusal logged — not merely hidden in the UI. |
| Provenance | Each call records the provider, model, input size, and a SHA-256 of exactly what was sent. The hash, not a copy, so your data isn't duplicated into a table with different retention. |
| Rate limit | Per workspace, so one person holding down a button can't run up the model bill. |
| Injection | Pasted vendor content is framed as untrusted data; the assistant is instructed to report an attempted injection as a finding rather than follow it. |

Everything except the assistant works with AI switched off — scoring, scope,
diagrams, documents, and the regulatory mapping never call a model.

## Separation of duties

With `require_separation_of_duties` on, the reviewer who last edited an
assessment cannot record its decision. Enforced by a **database trigger**, not
by the server action — an action-level check is a suggestion, since anything
holding a valid token can talk to PostgREST directly. Off by default because a
solo workspace cannot satisfy it; the settings page recommends turning it on as
soon as a second member joins.

## Control assurance

**Settings → Our controls** runs the platform's own controls and labels each by
how it is known:

- **verified** — read from the database catalog at page load (RLS on every
  tenant table, audit trail has no amend policy, the duties trigger exists,
  tenant resolution is privilege-isolated)
- **configured** — read from this workspace's live settings
- **attested** — an operational statement that cannot be machine-checked here

That distinction is the point. Presenting all three as identical green ticks
would be the dishonesty the product exists to catch.

## Multi-tenancy & security

- Every tenant table carries `org_id`; **RLS** restricts reads to org members and writes to
  role-appropriate members. Helpers `auth_org_ids()` / `has_org_role()` are `SECURITY DEFINER`.
- Orgs are created via the `create_organization` RPC (atomic org + owner membership) to avoid the
  RLS insert chicken-and-egg.
- Auth decisions always use `getUser()` (verifies the JWT); the session is refreshed in `middleware.ts`.
- The service-role client (`lib/supabase/admin.ts`) is ESLint-fenced to `scripts/` only.

## Roadmap (post-foundation)

Stripe billing (schema seam already present: `organizations.stripe_customer_id` / `plan`),
transactional email for invitations (the accept flow works today; the link is handed to the inviter
to send), richer analytics, and a larger prefilled tool library.

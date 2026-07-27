# AI Onboarding Self-Evaluation Workbench

An enterprise-grade, frontend-only web application for **self-evaluating AI tools, platforms,
agents, RAG applications, and connectors before they enter formal enterprise review.**

It is a **self-evaluation and learning aid** — a deep-dive review *simulator*, not a questionnaire.
Pick the AI tool you're evaluating, walk team-by-team through **20 enterprise review lenses**,
self-score readiness, track controls/evidence/blockers, and get an overall readiness score, risk
level, and go/no-go recommendation — plus draft evidence artifacts to prepare for the real reviews.

> **Disclaimer:** This tool does not replace official enterprise approval workflows. Final decisions
> must follow the organization's formal architecture, security, privacy, legal, QRM/risk, data
> governance, platform, support, finance, change management, and go/no-go approval processes.

## Features

- **Executive Dashboard** — readiness (0–100), risk (Low→Critical), evidence %, blockers, teams
  ready/blocked, approval status, and go/no-go recommendation.
- **Self-Evaluation Center** — all 20 review lenses as expandable cards: review purpose, scope,
  detailed checklist, required controls, evidence, pass/conditional/blocker criteria, common
  findings, remediation, and per-team self-assessment (score 0–5, owner, due date, notes, decision).
- **Team Lens Library** — read-only reference of every control pack.
- **Intake Register** — all profiles with live readiness/risk/approval.
- **Workflow Stages** — 25-stage lifecycle from intake to retirement.
- **Platform Matrix** — 11 platforms × 13 comparison columns.
- **Approvals** — sign-off matrix per team.
- **Evidence Factory** — generates 20 draft artifacts, each stamped *"Draft only. Requires official review."*
- **Export & Tools** — JSON, CSV, Markdown, Go/No-Go, Remediation Plan, and print-friendly reports.
- **Profiles** — 11 default profiles + create/duplicate/delete/import/export.

## Review Lenses (20)

Business · AI Enablement · Enterprise Architecture · Solution Architecture · Security/SAR ·
Privacy/PIA · Legal/OGC · QRM/Risk · Data Governance · IAM · Platform/Cloud · Secure SDLC ·
AI Engineering · Agent Governance · Connector Governance · Operations/Support · Adoption/Training ·
Vendor Risk · Finance/FinOps · Go/No-Go.

Review intensity is **conditional**: enabling agents requires Agent Governance; connectors require
Connector Governance; PII/client data/autonomous actions/external vendor/production escalate the
relevant lenses.

## Tech stack

- **React 18 + Vite + TypeScript** (strict), single-page app, no backend.
- **Zustand** (+ persist) for state; everything is stored in `localStorage` — no data leaves your browser.
- **HashRouter** so it deploys to any static host.
- Plain CSS design tokens; dedicated `print.css` for print-ready reports.
- Pure, unit-tested scoring engine (`src/engine`).

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # type-check + production build to dist/
npm run preview   # preview the production build
npm test          # run the scoring-engine unit tests (Vitest)
```

## Project structure

```
src/
  types/     domain models (Profile, TeamLens, TeamAssessment, WorkflowStage, ScoreResult)
  data/      teamLenses.ts (20 control packs), defaultProfiles, platformMatrix, workflowStages
  store/     Zustand store with localStorage persistence
  engine/    pure scoring / risk / recommendation / review-intensity functions (+ tests)
  export/    JSON/CSV/Markdown builders + Evidence Factory (20 generators)
  components/ layout (sidebar, header) + reusable UI primitives
  features/  ProfileForm, generic TeamLensCard, TeamLensPage
  pages/     18 route pages
```

The 20 review lenses are **data** (`src/data/teamLenses.ts`), rendered generically by a single
`TeamLensCard` component — there are no per-team components.

-- ============================================================================
-- Clearance AI — 0001 init schema
-- Multi-tenant: organizations → memberships → evaluations → (assessments, ...)
-- Every tenant table carries org_id for fast, denormalized RLS checks.
-- ============================================================================

create extension if not exists "pgcrypto";

-- Roles within an organization
do $$ begin
  create type org_role as enum ('owner','admin','member','viewer');
exception when duplicate_object then null; end $$;

-- Tenants ---------------------------------------------------------------------
create table if not exists organizations (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  created_by  uuid not null references auth.users(id),
  -- Stripe billing seam (populated in a later phase)
  stripe_customer_id text,
  plan        text not null default 'free',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- User ↔ org membership + role
create table if not exists memberships (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       org_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);
create index if not exists memberships_user_idx on memberships(user_id);
create index if not exists memberships_org_idx  on memberships(org_id);

-- Email-based invites (pre-account)
create table if not exists invitations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  email       text not null,
  role        org_role not null default 'member',
  token       text unique not null default encode(gen_random_bytes(18), 'hex'),
  invited_by  uuid references auth.users(id),
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists invitations_org_idx on invitations(org_id);
create index if not exists invitations_email_idx on invitations(lower(email));

-- Evaluations (the old "Profile": one AI tool being self-evaluated) ------------
create table if not exists evaluations (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references organizations(id) on delete cascade,
  name               text not null,
  platform           text not null default '',
  tool_type          text not null default 'Internal AI application',
  use_case           text not null default '',
  business_owner     text not null default '',
  technical_owner    text not null default '',
  executive_sponsor  text not null default '',
  target_users       text not null default '',
  data_types         text[] not null default '{}',
  data_classification text not null default 'Internal',
  environment        text not null default 'Sandbox',
  model              text not null default '',
  agent_enabled      boolean not null default false,
  connector_enabled  boolean not null default false,
  rag_enabled        boolean not null default false,
  external_vendor    boolean not null default false,
  client_data        boolean not null default false,
  pii                boolean not null default false,
  autonomous_actions boolean not null default false,
  status             text not null default 'Draft',
  source_template_id text,
  created_by         uuid references auth.users(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists evaluations_org_idx on evaluations(org_id);

-- Per-evaluation per-lens self-assessment (nested map, flattened to rows) ------
create table if not exists team_assessments (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  evaluation_id uuid not null references evaluations(id) on delete cascade,
  team_id       text not null,
  score         int  not null default -1,          -- 0..5, -1 unset
  checked_controls jsonb not null default '{}'::jsonb,
  checked_evidence jsonb not null default '{}'::jsonb,
  active_blockers  jsonb not null default '{}'::jsonb,
  marked_learned           boolean not null default false,
  needs_remediation        boolean not null default false,
  requires_formal_approval boolean not null default false,
  notes         text not null default '',
  owner         text not null default '',
  due_date      text not null default '',
  residual_risk text not null default '',
  decision      text not null default 'Not Reviewed',
  updated_at    timestamptz not null default now(),
  unique (evaluation_id, team_id)
);
create index if not exists team_assessments_eval_idx on team_assessments(evaluation_id);
create index if not exists team_assessments_org_idx  on team_assessments(org_id);

-- Evidence links (variable-length collection) ---------------------------------
create table if not exists evidence_links (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  evaluation_id uuid not null references evaluations(id) on delete cascade,
  team_id       text not null,
  label         text not null default '',
  url           text not null default '',
  created_at    timestamptz not null default now()
);
create index if not exists evidence_links_eval_team_idx on evidence_links(evaluation_id, team_id);

-- 25 workflow stages per evaluation -------------------------------------------
create table if not exists workflow_stages (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  evaluation_id uuid not null references evaluations(id) on delete cascade,
  stage_key     text not null,
  ordinal       int  not null,
  name          text not null,
  status        text not null default 'Not Started',
  owner         text not null default '',
  due_date      text not null default '',
  evidence      text not null default '',
  notes         text not null default '',
  blocker       text not null default '',
  decision      text not null default 'Not Reviewed',
  updated_at    timestamptz not null default now(),
  unique (evaluation_id, stage_key)
);
create index if not exists workflow_stages_eval_idx on workflow_stages(evaluation_id);

-- Generated reports (persisted artifacts) -------------------------------------
create table if not exists generated_reports (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  evaluation_id uuid not null references evaluations(id) on delete cascade,
  title         text not null,
  kind          text not null,
  content       text not null,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now()
);
create index if not exists generated_reports_eval_idx on generated_reports(evaluation_id);

-- AI-tool prefill library (shared; read-only to tenants) ----------------------
create table if not exists tool_templates (
  id         text primary key,
  name       text not null,
  vendor     text not null default '',
  platform   text not null default '',
  tool_type  text not null default '',
  summary    text not null default '',
  category   text not null default '',
  defaults   jsonb not null default '{}'::jsonb,
  suggested_assessments jsonb not null default '{}'::jsonb,
  is_active  boolean not null default true,
  sort_order int not null default 0
);

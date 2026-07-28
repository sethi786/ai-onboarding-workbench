-- ============================================================================
-- 0008 — Audit trail and AI governance controls.
--
-- Two things no enterprise buyer will sign without, and one of them we were
-- already advertising: the marketing site promises "a durable record of what
-- was reviewed, by whom, and what was decided" and no such record existed.
--
-- The second is sharper than it looks. This product sends customer governance
-- data to a model. A CISO evaluating it will ask, in order: can we turn that
-- off, where does the data go, and can you prove what you sent. A governance
-- tool that cannot answer those about itself does not get bought.
-- ============================================================================

-- AUDIT EVENTS ---------------------------------------------------------------
create table if not exists audit_events (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  actor_id    uuid references auth.users(id) on delete set null,
  -- Denormalized so the trail still names a person after the account is gone.
  -- An audit record that becomes anonymous when someone leaves is not a trail.
  actor_email text,
  action      text not null,
  subject_type text,
  subject_id  text,
  summary     text not null,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists audit_org_time_idx on audit_events(org_id, created_at desc);
create index if not exists audit_subject_idx on audit_events(org_id, subject_type, subject_id);

comment on table audit_events is
  'Append-only. There is deliberately no UPDATE or DELETE policy: a trail that '
  'can be rewritten by the people it describes is not evidence.';

alter table audit_events enable row level security;

-- Members read their own workspace's trail.
create policy audit_select on audit_events
  for select using (org_id in (select auth_org_ids()));

-- Anyone who can act can record that they acted. Writing an event for a
-- workspace you are not in is refused.
create policy audit_insert on audit_events
  for insert with check (org_id in (select auth_org_ids()));

-- No update or delete policy exists, so RLS denies both for every role that
-- goes through it. Belt and braces at the grant level as well.
revoke update, delete on audit_events from authenticated;

-- AI GOVERNANCE --------------------------------------------------------------
alter table organizations
  -- Off is a legitimate, supported configuration, not a degraded one. Some
  -- organizations cannot send governance data to a third-party model at all,
  -- and they are exactly the ones who buy this.
  add column if not exists ai_enabled boolean not null default true,
  -- Retention for the AI call record, in days. Zero means keep indefinitely.
  add column if not exists ai_log_retention_days integer not null default 0;

comment on column organizations.ai_enabled is
  'When false, every AI affordance is refused server-side, not merely hidden.';

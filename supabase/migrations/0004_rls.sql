-- ============================================================================
-- Clearance AI — 0004 Row Level Security
-- Strict tenant isolation. Reads gated by membership; writes gated by role.
-- Child tables use their denormalized org_id so every check is the same fast
-- `org_id in (select auth_org_ids())` — no per-row joins.
-- ============================================================================

alter table organizations   enable row level security;
alter table memberships     enable row level security;
alter table invitations     enable row level security;
alter table evaluations     enable row level security;
alter table team_assessments enable row level security;
alter table evidence_links  enable row level security;
alter table workflow_stages enable row level security;
alter table generated_reports enable row level security;
alter table tool_templates  enable row level security;

-- ORGANIZATIONS ---------------------------------------------------------------
-- Insert is only via create_organization() (SECURITY DEFINER); no insert policy.
create policy org_select on organizations
  for select using (id in (select auth_org_ids()));
create policy org_update on organizations
  for update using (has_org_role(id, array['owner','admin']::org_role[]))
  with check (has_org_role(id, array['owner','admin']::org_role[]));
create policy org_delete on organizations
  for delete using (has_org_role(id, array['owner']::org_role[]));

-- MEMBERSHIPS -----------------------------------------------------------------
create policy mem_select on memberships
  for select using (org_id in (select auth_org_ids()));
create policy mem_manage on memberships
  for all using (has_org_role(org_id, array['owner','admin']::org_role[]))
  with check (has_org_role(org_id, array['owner','admin']::org_role[]));

-- INVITATIONS -----------------------------------------------------------------
create policy inv_manage on invitations
  for all using (has_org_role(org_id, array['owner','admin']::org_role[]))
  with check (has_org_role(org_id, array['owner','admin']::org_role[]));

-- Reusable role sets are inlined per policy below.

-- EVALUATIONS -----------------------------------------------------------------
create policy eval_select on evaluations
  for select using (org_id in (select auth_org_ids()));
create policy eval_insert on evaluations
  for insert with check (has_org_role(org_id, array['owner','admin','member']::org_role[]));
create policy eval_update on evaluations
  for update using (org_id in (select auth_org_ids()))
  with check (has_org_role(org_id, array['owner','admin','member']::org_role[]));
create policy eval_delete on evaluations
  for delete using (has_org_role(org_id, array['owner','admin']::org_role[]));

-- Child-table policy template (team_assessments, evidence_links,
-- workflow_stages, generated_reports): read = member, write = member+.
create policy ta_select on team_assessments
  for select using (org_id in (select auth_org_ids()));
create policy ta_write on team_assessments
  for all using (has_org_role(org_id, array['owner','admin','member']::org_role[]))
  with check (has_org_role(org_id, array['owner','admin','member']::org_role[]));

create policy el_select on evidence_links
  for select using (org_id in (select auth_org_ids()));
create policy el_write on evidence_links
  for all using (has_org_role(org_id, array['owner','admin','member']::org_role[]))
  with check (has_org_role(org_id, array['owner','admin','member']::org_role[]));

create policy ws_select on workflow_stages
  for select using (org_id in (select auth_org_ids()));
create policy ws_write on workflow_stages
  for all using (has_org_role(org_id, array['owner','admin','member']::org_role[]))
  with check (has_org_role(org_id, array['owner','admin','member']::org_role[]));

create policy gr_select on generated_reports
  for select using (org_id in (select auth_org_ids()));
create policy gr_write on generated_reports
  for all using (has_org_role(org_id, array['owner','admin','member']::org_role[]))
  with check (has_org_role(org_id, array['owner','admin','member']::org_role[]));

-- TOOL TEMPLATES (shared library) --------------------------------------------
-- Any authenticated user can read active templates; writes only via service role.
create policy tt_select on tool_templates
  for select to authenticated using (is_active);

-- Findings from the first hosted Supabase audit. Preserve customer data and
-- authorization semantics while removing inherited function/API privileges.
begin;

alter function public.set_updated_at() set search_path=public,pg_temp;
alter function public.protect_organization_billing() set search_path=public,pg_temp;

-- Supabase grants EXECUTE directly to anon/authenticated by default, in
-- addition to PostgreSQL's PUBLIC grant. Trigger functions are not client RPCs.
-- Revoking invocation does not prevent installed triggers from running.
revoke all on function public.set_updated_at(),
  public.assert_child_org_matches(), public.maintain_evaluation_scope(),
  public.protect_review_identity(), public.seed_evaluation_workflow(),
  public.protect_organization_billing(), public.enforce_evaluation_quota(),
  public.guard_membership(), public.record_workspace_activity(),
  public.touch_evaluation_activity(), public.protect_billed_workspace_deletion()
  from public, anon, authenticated;

-- Scope the existing customer policies to their actual API role. Keep the
-- membership/role predicates; TO authenticated alone is not authorization.
do $$ declare policy_row record; begin
  for policy_row in
    select tablename,policyname from pg_policies where schemaname='public'
      and tablename in ('organizations','memberships','invitations',
        'evaluations','team_assessments','evidence_links','workflow_stages',
        'generated_reports','tool_templates','workspace_activity')
  loop
    execute format('alter policy %I on public.%I to authenticated',
      policy_row.policyname,policy_row.tablename);
  end loop;
end $$;

-- A FOR ALL write policy also participates in SELECT, duplicating each
-- membership read policy. Split writes so viewers retain their existing read
-- access and each read only evaluates the membership predicate once.
do $$ declare child record; begin
  for child in select * from (values
    ('team_assessments','ta'),('evidence_links','el'),
    ('workflow_stages','ws'),('generated_reports','gr')) as children(table_name,prefix)
  loop
    execute format('drop policy %I on public.%I',child.prefix || '_write',child.table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.has_org_role(org_id,array[''owner'',''admin'',''member'']::public.org_role[]))',child.prefix || '_insert',child.table_name);
    execute format('create policy %I on public.%I for update to authenticated using (public.has_org_role(org_id,array[''owner'',''admin'',''member'']::public.org_role[])) with check (public.has_org_role(org_id,array[''owner'',''admin'',''member'']::public.org_role[]))',child.prefix || '_update',child.table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (public.has_org_role(org_id,array[''owner'',''admin'',''member'']::public.org_role[]))',child.prefix || '_delete',child.table_name);
  end loop;
end $$;

-- Cover tenant filters and foreign-key checks during deletion/retention work.
create index if not exists billing_events_org_idx on public.billing_events(org_id);
create index if not exists evaluations_created_by_idx on public.evaluations(created_by);
create index if not exists evidence_links_org_idx on public.evidence_links(org_id);
create index if not exists generated_reports_created_by_idx on public.generated_reports(created_by);
create index if not exists generated_reports_org_idx on public.generated_reports(org_id);
create index if not exists invitations_invited_by_idx on public.invitations(invited_by);
create index if not exists organizations_created_by_idx on public.organizations(created_by);
create index if not exists workflow_stages_org_idx on public.workflow_stages(org_id);

commit;

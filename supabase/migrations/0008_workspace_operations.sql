-- Workspace operations and database-generated activity history.
-- Events intentionally contain field names, never evidence URLs, notes, tokens,
-- payment details, or before/after document contents. History begins here.
create table workspace_activity (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  evaluation_id uuid,
  actor_id uuid,
  entity_type text not null,
  entity_id uuid not null,
  action text not null check (action in ('created','updated','deleted')),
  changed_fields text[] not null default '{}',
  created_at timestamptz not null default clock_timestamp()
);
create index workspace_activity_timeline on workspace_activity(org_id,created_at desc,id desc);
create index workspace_activity_evaluation on workspace_activity(org_id,evaluation_id,created_at desc);
alter table workspace_activity enable row level security;
create policy activity_read on workspace_activity for select to authenticated
  using (org_id in (select auth_org_ids()));
revoke all on workspace_activity from public, authenticated;
grant select on workspace_activity to authenticated;
grant all on workspace_activity to service_role;

create function record_workspace_activity() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
declare
  record_data jsonb; previous_data jsonb; target_org uuid; target_eval uuid;
  fields text[]; allowed_fields text[];
begin
  record_data := case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
  previous_data := case when tg_op='UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  target_org := case when tg_table_name='organizations' then (record_data->>'id')::uuid else (record_data->>'org_id')::uuid end;
  target_eval := case when tg_table_name='evaluations' then (record_data->>'id')::uuid else (record_data->>'evaluation_id')::uuid end;
  -- Cascaded deletion should not recreate children of a removed workspace.
  if not exists(select 1 from organizations where id=target_org) then return null; end if;
  -- Parent deletion is represented by one evaluation event, not every child.
  if tg_op='DELETE' and tg_table_name not in ('evaluations','organizations','memberships','invitations')
    and not exists(select 1 from evaluations where id=target_eval) then return null; end if;
  -- Initial workflow is created atomically with its evaluation; record later edits.
  if tg_table_name='workflow_stages' and tg_op='INSERT' then return null; end if;
  allowed_fields := case tg_table_name
    when 'organizations' then array['name','plan']
    when 'memberships' then array['role']
    when 'invitations' then array['role','accepted_at','revoked_at','expires_at']
    else array['name','platform','tool_type','tool_category','use_case','business_owner','technical_owner','executive_sponsor','target_users','data_types','data_classification','environment','model','agent_enabled','connector_enabled','rag_enabled','external_vendor','client_data','pii','autonomous_actions','self_hosted','status','scope_revision','score','checked_controls','checked_evidence','active_blockers','marked_learned','needs_remediation','requires_formal_approval','notes','owner','due_date','residual_risk','decision','evidence_id','label','url','expires_on','evidence','blocker','title','kind','content']
  end;
  select coalesce(array_agg(k order by k),'{}') into fields
    from unnest(allowed_fields) k
    where record_data ? k and (tg_op<>'UPDATE' or record_data->k is distinct from previous_data->k);
  if tg_op='UPDATE' and cardinality(fields)=0 then return null; end if;
  insert into workspace_activity(org_id,evaluation_id,actor_id,entity_type,entity_id,action,changed_fields)
    values(target_org,target_eval,auth.uid(),tg_table_name,(record_data->>'id')::uuid,
      case tg_op when 'INSERT' then 'created' when 'UPDATE' then 'updated' else 'deleted' end,fields);
  return null;
end $$;
revoke all on function record_workspace_activity() from public,authenticated;

do $$ declare entity text; begin
  foreach entity in array array['organizations','memberships','invitations','evaluations','team_assessments','evidence_links','workflow_stages','generated_reports'] loop
    execute format('create trigger trg_activity after insert or update or delete on %I for each row execute function record_workspace_activity()',entity);
  end loop;
end $$;

-- Only workspace managers can resolve authentication emails. Never expose an
-- unscoped user directory or a service key to the browser.
create function list_workspace_members(p_org uuid)
returns table(id uuid,user_id uuid,email text,role org_role,created_at timestamptz)
language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
  if not has_org_role(p_org,array['owner','admin']::org_role[]) then raise exception 'Not authorized'; end if;
  return query select m.id,m.user_id,u.email::text,m.role,m.created_at
    from memberships m join auth.users u on u.id=m.user_id where m.org_id=p_org order by m.created_at,m.id;
end $$;
revoke all on function list_workspace_members(uuid) from public;
grant execute on function list_workspace_members(uuid) to authenticated;

-- Validate direct RPC callers as well as the app form. Stable URLs are kept
-- when the display name changes.
create or replace function create_organization(p_name text,p_slug text) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare workspace uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_name is null or length(trim(p_name)) not between 1 and 120 or p_name ~ '[[:cntrl:]]' then raise exception 'Use a workspace name of 1 to 120 characters'; end if;
  if p_slug is null or length(p_slug) not between 3 and 160 or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'Invalid workspace address'; end if;
  insert into organizations(slug,name,created_by) values(p_slug,trim(p_name),auth.uid()) returning id into workspace;
  insert into memberships(org_id,user_id,role) values(workspace,auth.uid(),'owner');
  return workspace;
end $$;
revoke all on function create_organization(text,text) from public;
grant execute on function create_organization(text,text) to authenticated;
alter table organizations add constraint workspace_name_valid
  check(length(trim(name)) between 1 and 120 and name !~ '[[:cntrl:]]') not valid;

-- Harden our existing SECURITY DEFINER functions against temporary-table
-- shadowing. Do not modify extension functions or unrelated project functions.
alter function auth_org_ids() set search_path=public,pg_temp;
alter function has_org_role(uuid,org_role[]) set search_path=public,pg_temp;
alter function assert_child_org_matches() set search_path=public,pg_temp;
alter function enforce_evaluation_quota() set search_path=public,pg_temp;
alter function guard_membership() set search_path=public,pg_temp;
alter function create_workspace_invitation(uuid,text,org_role) set search_path=public,pg_temp;
alter function accept_workspace_invitation(text) set search_path=public,pg_temp;
alter function revoke_workspace_invitation(uuid) set search_path=public,pg_temp;
alter function claim_checkout(uuid,uuid) set search_path=public,pg_temp;
alter function apply_billing_event(text,text,text,timestamptz) set search_path=public,pg_temp;
alter function submit_sales_lead(text,text,text,text,text) set search_path=public,pg_temp;

-- Keep portfolio recency accurate when a reviewer saves child records. Parent
-- scope logic ignores updated_at, so this never invalidates the assessment.
create function touch_evaluation_activity() returns trigger
language plpgsql set search_path=public,pg_temp as $$
begin
  if tg_op='DELETE' then
    update evaluations set updated_at=now() where id=old.evaluation_id and org_id=old.org_id;
  else
    update evaluations set updated_at=now() where id=new.evaluation_id and org_id=new.org_id;
  end if;
  return null;
end $$;
revoke all on function touch_evaluation_activity() from public,authenticated;
create trigger trg_review_recency after insert or update or delete on team_assessments for each row execute function touch_evaluation_activity();
create trigger trg_evidence_recency after insert or update or delete on evidence_links for each row execute function touch_evaluation_activity();
create trigger trg_workflow_recency after update on workflow_stages for each row execute function touch_evaluation_activity();

-- A direct API deletion must not orphan a Stripe customer/subscription. The
-- operator handles deletion after billing cancellation and retention review.
create function protect_billed_workspace_deletion() returns trigger
language plpgsql set search_path=public,pg_temp as $$
begin
  if old.stripe_customer_id is not null and current_user not in ('postgres','service_role','supabase_admin') then
    raise exception 'Contact support to delete a workspace with billing history after canceling its subscription';
  end if;
  return old;
end $$;
create trigger trg_billed_workspace_delete before delete on organizations for each row execute function protect_billed_workspace_deletion();

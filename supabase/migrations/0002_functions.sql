-- ============================================================================
-- Clearance AI — 0002 functions & triggers
-- Membership helpers (SECURITY DEFINER), updated_at, child org_id integrity,
-- and the create_organization RPC (avoids the RLS insert chicken-and-egg).
-- ============================================================================

-- Org ids the calling user belongs to. SECURITY DEFINER bypasses RLS on memberships.
create or replace function auth_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from memberships where user_id = auth.uid()
$$;

-- Does the caller hold one of the allowed roles in the given org?
create or replace function has_org_role(target_org uuid, allowed org_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from memberships
    where user_id = auth.uid()
      and org_id = target_org
      and role = any(allowed)
  )
$$;

-- Create an org + owner membership atomically, returning the new org id.
create or replace function create_organization(p_name text, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into organizations (slug, name, created_by)
  values (p_slug, p_name, auth.uid())
  returning id into v_org_id;

  insert into memberships (org_id, user_id, role)
  values (v_org_id, auth.uid(), 'owner');

  return v_org_id;
end;
$$;

-- Generic updated_at maintainer
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Ensure a child row's org_id matches its parent evaluation's org_id.
create or replace function assert_child_org_matches()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent_org uuid;
begin
  select org_id into v_parent_org from evaluations where id = new.evaluation_id;
  if v_parent_org is null then
    raise exception 'parent evaluation % not found', new.evaluation_id;
  end if;
  if new.org_id is distinct from v_parent_org then
    raise exception 'org_id mismatch with parent evaluation';
  end if;
  return new;
end;
$$;

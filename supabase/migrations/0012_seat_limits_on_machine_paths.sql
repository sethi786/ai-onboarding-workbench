-- ============================================================================
-- 0012 — Enforce the seat limit on the paths a machine uses.
--
-- Found by auditing a 3,000-user Copilot rollout: the seat quota is checked in
-- `assertMemberQuota`, which is called from exactly one place — inviting a
-- member by hand. Neither SCIM provisioning nor SSO just-in-time membership
-- consults it, so both create memberships without limit.
--
-- It is not reachable at signup, because configuring SSO or SCIM requires the
-- Enterprise plan and Enterprise has no seat cap. It is reachable on downgrade:
-- an Enterprise workspace that drops to Team keeps its verified domains and its
-- live SCIM tokens, and the directory carries on admitting people past the
-- 25-seat limit indefinitely. The plan was checked when the feature was
-- configured and never again when it was used, which is the general shape of
-- the bug rather than a detail of this one.
--
-- Verified before and after against a real PostgreSQL instance: on a `team`
-- workspace, SCIM took memberships from 1 to 2 and an SSO claim took them to 3.
-- ============================================================================

-- Seat caps, mirroring lib/plans.ts. Duplicating them here is a drift risk, so
-- a test (lib/__tests__/plans.test.ts) parses this function and fails if the
-- two disagree — the numbers cannot quietly diverge.
create or replace function org_seat_limit(p_org uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select case (select plan from organizations where id = p_org)
    when 'free'       then 3
    when 'team'       then 25
    when 'enterprise' then null
    else 3                                  -- unknown plan: the most restrictive
  end
$$;

/**
 * Seats consumed: accepted members plus invitations still outstanding.
 * The same definition assertMemberQuota uses, so a human and a directory see
 * one number rather than two.
 */
create or replace function org_seats_used(p_org uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select (select count(*) from memberships where org_id = p_org)::int
       + (select count(*) from invitations where org_id = p_org and accepted_at is null)::int
$$;

/** Would admitting one more person exceed the plan? Existing members are free. */
create or replace function org_seat_available(p_org uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (select 1 from memberships where org_id = p_org and user_id = p_user) then true
    when org_seat_limit(p_org) is null then true
    else org_seats_used(p_org) < org_seat_limit(p_org)
  end
$$;

-- ---------------------------------------------------------------- SCIM sync
-- Refuses loudly. A silent skip would leave the directory believing somebody
-- has access they do not have, which is worse than a failed provisioning event
-- the administrator can see and act on.
create or replace function scim_sync_membership(
  p_org      uuid,
  p_email    text,
  p_active   boolean,
  p_role     org_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  select id into v_user from auth.users where lower(email) = lower(p_email);
  if v_user is null then
    return;
  end if;

  -- Owners are invisible to the directory; see 0011 for why.
  if exists (
    select 1 from memberships
    where org_id = p_org and user_id = v_user and role = 'owner'
  ) then
    return;
  end if;

  if p_active then
    if not org_seat_available(p_org, v_user) then
      raise exception 'scim: seat limit reached (% of % seats in use)',
        org_seats_used(p_org), org_seat_limit(p_org)
        using errcode = '53400';
    end if;
    insert into memberships (org_id, user_id, role)
    values (p_org, v_user, p_role)
    on conflict (org_id, user_id) do update set role = excluded.role;
  else
    delete from memberships where org_id = p_org and user_id = v_user;
  end if;
end;
$$;

-- ------------------------------------------------------------- SSO claim
-- Returns null rather than raising: the caller has a valid session and the
-- honest outcome is "you are signed in but this workspace has no seat for
-- you", not a failed sign-in they cannot interpret.
create or replace function sso_claim_membership()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email  text;
  v_domain text;
  v_dom    sso_domains;
  v_scim   scim_users;
  v_slug   text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then
    return null;
  end if;
  v_domain := lower(split_part(v_email, '@', 2));

  select * into v_dom from sso_domains
  where lower(domain) = v_domain and verified_at is not null;
  if v_dom.id is null then
    return null;
  end if;

  if v_dom.require_scim then
    select * into v_scim from scim_users
    where org_id = v_dom.org_id and lower(user_name) = lower(v_email);
    if v_scim.id is null or not v_scim.active then
      return null;
    end if;
  end if;

  if not org_seat_available(v_dom.org_id, auth.uid()) then
    return null;
  end if;

  insert into memberships (org_id, user_id, role)
  values (v_dom.org_id, auth.uid(), coalesce(v_scim.role, v_dom.default_role))
  on conflict (org_id, user_id) do nothing;

  select slug into v_slug from organizations where id = v_dom.org_id;
  return v_slug;
end;
$$;

revoke all on function org_seat_limit(uuid)          from public;
revoke all on function org_seats_used(uuid)          from public;
revoke all on function org_seat_available(uuid,uuid) from public;
grant execute on function sso_claim_membership() to authenticated;

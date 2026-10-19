-- Protect commercial entitlements at the database boundary, not just in the UI.
alter table organizations add column billing_observed_at timestamptz;
alter table organizations add constraint organization_plan_valid check (plan in ('free','team','pro','enterprise')) not valid;
create unique index organizations_stripe_customer_unique on organizations(stripe_customer_id) where stripe_customer_id is not null;

create function protect_organization_billing() returns trigger language plpgsql as $$
begin
  if new.id is distinct from old.id or new.created_by is distinct from old.created_by then
    raise exception 'Workspace identity is immutable';
  end if;
  if current_user not in ('postgres','service_role','supabase_admin') and
    (new.plan is distinct from old.plan or new.stripe_customer_id is distinct from old.stripe_customer_id or new.billing_observed_at is distinct from old.billing_observed_at) then
    raise exception 'Billing fields can only be changed by the billing service';
  end if;
  return new;
end $$;
create trigger trg_protect_organization_billing before update on organizations for each row execute function protect_organization_billing();

-- Lock the tenant before counting so concurrent writes cannot exceed a quota.
create function enforce_evaluation_quota() returns trigger language plpgsql security definer set search_path=public as $$
declare current_plan text;
begin
  select plan into current_plan from organizations where id=new.org_id for update;
  if current_plan not in ('team','pro','enterprise') and (select count(*) from evaluations where org_id=new.org_id) >= 3 then
    raise exception 'Starter includes 3 evaluations. Remove one or upgrade to Team.';
  end if;
  return new;
end $$;
create trigger trg_evaluation_quota before insert on evaluations for each row execute function enforce_evaluation_quota();

-- Admins cannot promote themselves to owner, move a membership, or remove the last owner.
drop policy mem_manage on memberships;
create policy mem_insert on memberships for insert with check (has_org_role(org_id,array['owner']::org_role[]));
create policy mem_update on memberships for update using (has_org_role(org_id,array['owner']::org_role[])) with check (has_org_role(org_id,array['owner']::org_role[]));
create policy mem_delete on memberships for delete using (has_org_role(org_id,array['owner']::org_role[]));
create function guard_membership() returns trigger language plpgsql security definer set search_path=public as $$
declare target_org uuid; current_plan text; member_limit int;
begin
  target_org := case when tg_op='DELETE' then old.org_id else new.org_id end;
  select plan into current_plan from organizations where id=target_org for update;
  if tg_op='UPDATE' and (new.org_id is distinct from old.org_id or new.user_id is distinct from old.user_id or new.id is distinct from old.id) then raise exception 'Membership identity is immutable'; end if;
  if tg_op in ('UPDATE','DELETE') and old.role='owner' then
    if (tg_op='DELETE' or new.role <> 'owner') and exists(select 1 from organizations where id=target_org) and
      (select count(*) from memberships where org_id=target_org and role='owner') <= 1 then raise exception 'A workspace needs at least one owner'; end if;
  end if;
  if tg_op='INSERT' then
    member_limit := case when current_plan='enterprise' then null when current_plan in ('team','pro') then 25 else 1 end;
    if member_limit is not null and (select count(*) from memberships where org_id=target_org) >= member_limit then raise exception 'Workspace member limit reached'; end if;
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
create trigger trg_membership_guard before insert or update or delete on memberships for each row execute function guard_membership();

alter table invitations add column expires_at timestamptz not null default now()+interval '7 days';
alter table invitations add column revoked_at timestamptz;
drop policy inv_manage on invitations;
create policy inv_read on invitations for select using (has_org_role(org_id,array['owner','admin']::org_role[]));

create function create_workspace_invitation(p_org uuid, p_email text, p_role org_role) returns text language plpgsql security definer set search_path=public as $$
declare current_plan text; seat_limit int; invite_token text;
begin
  if not has_org_role(p_org,array['owner','admin']::org_role[]) then raise exception 'Not authorized'; end if;
  if p_role not in ('admin','member','viewer') or (p_role='admin' and not has_org_role(p_org,array['owner']::org_role[])) then raise exception 'Only owners can invite admins'; end if;
  if length(p_email)>254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Invalid email'; end if;
  select plan into current_plan from organizations where id=p_org for update;
  seat_limit := case when current_plan='enterprise' then null when current_plan in ('team','pro') then 25 else 1 end;
  select token into invite_token from invitations where org_id=p_org and lower(email)=lower(trim(p_email)) and accepted_at is null and revoked_at is null and expires_at>now();
  if invite_token is not null then raise exception 'An active invitation already exists. Revoke it before creating another.'; end if;
  if seat_limit is not null and ((select count(*) from memberships where org_id=p_org)+(select count(*) from invitations where org_id=p_org and accepted_at is null and revoked_at is null and expires_at>now())) >= seat_limit then raise exception 'Workspace member limit reached. Upgrade or revoke an invitation.'; end if;
  insert into invitations(org_id,email,role,invited_by) values(p_org,lower(trim(p_email)),p_role,auth.uid()) returning token into invite_token;
  return invite_token;
end $$;

create function accept_workspace_invitation(p_token text) returns text language plpgsql security definer set search_path=public as $$
declare invitation invitations; user_email text; confirmed timestamptz; workspace_slug text;
begin
  if auth.uid() is null then raise exception 'Sign in to accept this invitation'; end if;
  select email,email_confirmed_at into user_email,confirmed from auth.users where id=auth.uid();
  if confirmed is null then raise exception 'Confirm your email before accepting'; end if;
  -- Match verified identity before locking or disclosing anything about the workspace.
  select * into invitation from invitations where token=p_token and lower(email)=lower(user_email) and revoked_at is null and expires_at>now();
  if invitation.id is null then raise exception 'Invitation is unavailable, expired, or belongs to another email'; end if;
  select slug into workspace_slug from organizations where id=invitation.org_id for update;
  select * into invitation from invitations where id=invitation.id for update;
  if invitation.revoked_at is not null or invitation.expires_at<=now() then raise exception 'Invitation is no longer available'; end if;
  if invitation.accepted_at is not null then
    if exists(select 1 from memberships where org_id=invitation.org_id and user_id=auth.uid()) then return workspace_slug; end if;
    raise exception 'Invitation was already used';
  end if;
  -- Do not grant a role on behalf of an inviter who no longer has that authority.
  if not exists(select 1 from memberships where org_id=invitation.org_id and user_id=invitation.invited_by and (role='owner' or (role='admin' and invitation.role in ('member','viewer')))) then raise exception 'Invitation is no longer authorized'; end if;
  insert into memberships(org_id,user_id,role) values(invitation.org_id,auth.uid(),invitation.role) on conflict(org_id,user_id) do nothing;
  update invitations set accepted_at=now() where id=invitation.id;
  return workspace_slug;
end $$;

create function revoke_workspace_invitation(p_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare target_org uuid;
begin
  select org_id into target_org from invitations where id=p_id;
  if not has_org_role(target_org,array['owner','admin']::org_role[]) then raise exception 'Not authorized'; end if;
  perform 1 from organizations where id=target_org for update;
  update invitations set revoked_at=now() where id=p_id and accepted_at is null;
end $$;

-- No customer can read or write lead intake, webhook ledger, or checkout locks.
create table sales_leads(id uuid primary key default gen_random_uuid(), name text not null, email text not null, company text not null default '', message text not null, kind text not null check(kind in ('contact','demo')), created_at timestamptz not null default now());
alter table sales_leads enable row level security;
create index sales_leads_email_time on sales_leads(email,created_at);
create table billing_events(id text primary key, org_id uuid not null references organizations(id) on delete cascade, created_at timestamptz not null default now());
alter table billing_events enable row level security;
create table billing_checkout_locks(org_id uuid primary key references organizations(id) on delete cascade, token uuid not null, expires_at timestamptz not null);
alter table billing_checkout_locks enable row level security;

create function claim_checkout(p_org uuid,p_token uuid) returns boolean language plpgsql security definer set search_path=public as $$
begin
  insert into billing_checkout_locks values(p_org,p_token,now()+interval '2 minutes') on conflict(org_id) do update set token=excluded.token,expires_at=excluded.expires_at where billing_checkout_locks.expires_at<now();
  return found;
end $$;

create function apply_billing_event(p_event text,p_customer text,p_plan text,p_observed_at timestamptz) returns boolean language plpgsql security definer set search_path=public as $$
declare workspace organizations;
begin
  if p_plan not in ('free','team') then raise exception 'Invalid billing plan'; end if;
  select * into workspace from organizations where stripe_customer_id=p_customer for update;
  if workspace.id is null then raise exception 'Unknown billing customer'; end if;
  insert into billing_events(id,org_id) values(p_event,workspace.id) on conflict do nothing;
  if not found then return false; end if;
  -- Reads begin before the provider fetch; an older concurrent observation cannot win.
  if workspace.billing_observed_at is null or workspace.billing_observed_at<p_observed_at then
    update organizations set plan=case when plan='enterprise' then plan else p_plan end,billing_observed_at=p_observed_at where id=workspace.id;
  end if;
  return true;
end $$;

-- Atomic, persistent rate limit by normalized email. No reliance on process memory.
create function submit_sales_lead(p_name text,p_email text,p_company text,p_message text,p_kind text) returns uuid language plpgsql security definer set search_path=public as $$
declare lead_id uuid;
begin
  if length(trim(p_name)) not between 1 and 100 or length(p_email)>254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(p_company)>150 or length(trim(p_message)) not between 10 and 5000 or p_kind not in ('contact','demo') then raise exception 'Invalid enquiry'; end if;
  perform pg_advisory_xact_lock(hashtextextended(lower(trim(p_email)),0));
  if (select count(*) from sales_leads where email=lower(trim(p_email)) and created_at>now()-interval '1 hour')>=3 then raise exception 'Too many requests'; end if;
  insert into sales_leads(name,email,company,message,kind) values(trim(p_name),lower(trim(p_email)),trim(p_company),trim(p_message),p_kind) returning id into lead_id;
  return lead_id;
end $$;

revoke all on function create_workspace_invitation(uuid,text,org_role), accept_workspace_invitation(text), revoke_workspace_invitation(uuid) from public;
grant execute on function create_workspace_invitation(uuid,text,org_role), accept_workspace_invitation(text), revoke_workspace_invitation(uuid) to authenticated;
revoke all on function claim_checkout(uuid,uuid),apply_billing_event(text,text,text,timestamptz),submit_sales_lead(text,text,text,text,text) from public,authenticated;
grant execute on function claim_checkout(uuid,uuid),apply_billing_event(text,text,text,timestamptz),submit_sales_lead(text,text,text,text,text) to service_role;
grant all on sales_leads,billing_events,billing_checkout_locks to service_role;

-- ============================================================================
-- 0011 — Enterprise identity: SAML SSO domains and SCIM 2.0 provisioning.
--
-- Two different problems that enterprises always buy together.
--
-- SSO answers "how does someone sign in" and Supabase Auth already does the
-- SAML half. What it does not know is which workspace the person belongs to,
-- so `sso_domains` maps a verified email domain to an organization and the
-- membership is created on first sign-in.
--
-- SCIM answers "who is allowed in, and who just left". Supabase has no SCIM
-- support at all, so the server is ours. The identity provider calls it as a
-- machine with a bearer token, not as a signed-in user, which means RLS keyed
-- on auth.uid() cannot gate it. Rather than reach for the service-role key in
-- application code — which would bypass every policy in this schema and put
-- the whole tenant boundary back into application discipline — the SCIM
-- endpoints call SECURITY DEFINER functions that authenticate the token
-- themselves and are structurally incapable of touching an organization other
-- than the one that token belongs to.
--
-- Tokens are stored only as SHA-256 hashes. A database leak yields nothing an
-- attacker can present to the API.
-- ============================================================================

-- ---------------------------------------------------------------- SSO domains
create table if not exists sso_domains (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations (id) on delete cascade,
  -- Lowercased bare domain, e.g. "northwind.com".
  domain        text not null,
  -- Set once the domain is proven. Unverified domains never admit anybody:
  -- otherwise claiming "gmail.com" would hand you every Gmail user who signs in.
  verified_at   timestamptz,
  verification_token text not null default encode(gen_random_bytes(16), 'hex'),
  -- Role granted to somebody arriving through this domain for the first time.
  default_role  org_role not null default 'member',
  -- When true, a domain match is not enough — SCIM must have provisioned the
  -- user and left them active. This is what an enterprise means by "we control
  -- access centrally", and it is the setting that makes offboarding real.
  require_scim  boolean not null default false,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);

-- One domain can only belong to one workspace, or sign-in is ambiguous and the
-- first workspace to claim a domain could absorb another's staff.
create unique index if not exists sso_domains_domain_key on sso_domains (lower(domain));
create index if not exists sso_domains_org_idx on sso_domains (org_id);

-- --------------------------------------------------------------- SCIM tokens
create table if not exists scim_tokens (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations (id) on delete cascade,
  name         text not null default 'SCIM token',
  -- First few characters, shown in the UI so an admin can tell two tokens
  -- apart without the secret being recoverable.
  token_prefix text not null,
  token_hash   text not null,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at   timestamptz
);

create unique index if not exists scim_tokens_hash_key on scim_tokens (token_hash);
create index if not exists scim_tokens_org_idx on scim_tokens (org_id);

-- ---------------------------------------------------------------- SCIM users
-- The directory's view of who should have access. Deliberately separate from
-- `memberships`: SCIM can provision somebody who has never signed in, and a
-- membership cannot exist without an auth user. This table is the entitlement;
-- the membership is created when they first arrive through SSO.
create table if not exists scim_users (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations (id) on delete cascade,
  -- The IdP's own identifier. Okta and Entra both send one and expect it back.
  external_id  text,
  user_name    text not null,
  given_name   text,
  family_name  text,
  display_name text,
  active       boolean not null default true,
  role         org_role not null default 'member',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index if not exists scim_users_org_username_key
  on scim_users (org_id, lower(user_name));
create unique index if not exists scim_users_org_external_key
  on scim_users (org_id, external_id) where external_id is not null;

alter table sso_domains enable row level security;
alter table scim_tokens enable row level security;
alter table scim_users  enable row level security;

-- Admins manage identity configuration; members can see nothing of it. The
-- SCIM API does not rely on these policies at all — it goes through the
-- SECURITY DEFINER functions below.
drop policy if exists sso_domains_rw  on sso_domains;
drop policy if exists scim_tokens_rw  on scim_tokens;
drop policy if exists scim_users_select on scim_users;
drop policy if exists scim_users_write  on scim_users;

create policy sso_domains_rw on sso_domains for all
  using (has_org_role(org_id, array['owner','admin']::org_role[]))
  with check (has_org_role(org_id, array['owner','admin']::org_role[]));

create policy scim_tokens_rw on scim_tokens for all
  using (has_org_role(org_id, array['owner','admin']::org_role[]))
  with check (has_org_role(org_id, array['owner','admin']::org_role[]));

-- Members may see who the directory has provisioned; only admins change it.
create policy scim_users_select on scim_users for select
  using (org_id in (select auth_org_ids()));
create policy scim_users_write on scim_users for all
  using (has_org_role(org_id, array['owner','admin']::org_role[]))
  with check (has_org_role(org_id, array['owner','admin']::org_role[]));

-- ============================================================================
-- SCIM API surface.
--
-- Every function takes the SHA-256 hash of the presented bearer token, resolves
-- it to exactly one organization, and refuses if it cannot. There is no
-- parameter by which a caller can name a different organization, so a
-- confused-deputy bug in the API layer cannot cross a tenant boundary.
-- ============================================================================

create or replace function scim_org_for_token(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select org_id into v_org
  from scim_tokens
  where token_hash = p_token_hash and revoked_at is null;

  if v_org is null then
    return null;
  end if;

  update scim_tokens set last_used_at = now() where token_hash = p_token_hash;
  return v_org;
end;
$$;

-- List, optionally filtered by userName. SCIM's filter grammar is large; the
-- providers that matter send `userName eq "..."` and nothing else during
-- provisioning, so that is what is supported and anything else returns the
-- unfiltered page rather than an error the IdP cannot act on.
create or replace function scim_list_users(
  p_token_hash text,
  p_user_name  text default null,
  p_start      int  default 1,
  p_count      int  default 100
)
returns setof scim_users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := scim_org_for_token(p_token_hash);
begin
  if v_org is null then
    raise exception 'scim: unauthorized' using errcode = '28000';
  end if;

  return query
  select * from scim_users
  where org_id = v_org
    and (p_user_name is null or lower(user_name) = lower(p_user_name))
  order by created_at
  offset greatest(0, coalesce(p_start, 1) - 1)
  limit least(greatest(coalesce(p_count, 100), 0), 500);
end;
$$;

create or replace function scim_count_users(p_token_hash text, p_user_name text default null)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := scim_org_for_token(p_token_hash);
  v_n int;
begin
  if v_org is null then
    raise exception 'scim: unauthorized' using errcode = '28000';
  end if;
  select count(*) into v_n from scim_users
  where org_id = v_org and (p_user_name is null or lower(user_name) = lower(p_user_name));
  return v_n;
end;
$$;

create or replace function scim_get_user(p_token_hash text, p_id uuid)
returns scim_users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := scim_org_for_token(p_token_hash);
  v_row scim_users;
begin
  if v_org is null then
    raise exception 'scim: unauthorized' using errcode = '28000';
  end if;
  select * into v_row from scim_users where id = p_id and org_id = v_org;
  return v_row;
end;
$$;

-- Create or replace by userName. SCIM clients retry, and Entra in particular
-- will POST a user it has already created after a transient failure; keying on
-- userName turns that from a duplicate-key error into the intended outcome.
create or replace function scim_put_user(
  p_token_hash  text,
  p_user_name   text,
  p_external_id text default null,
  p_given_name  text default null,
  p_family_name text default null,
  p_display_name text default null,
  p_active      boolean default true,
  p_role        org_role default null
)
returns scim_users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org  uuid := scim_org_for_token(p_token_hash);
  v_row  scim_users;
  v_role org_role;
begin
  if v_org is null then
    raise exception 'scim: unauthorized' using errcode = '28000';
  end if;
  if p_user_name is null or length(trim(p_user_name)) = 0 then
    raise exception 'scim: userName is required' using errcode = '22023';
  end if;

  v_role := coalesce(p_role, (select default_role from sso_domains
                              where org_id = v_org
                                and lower(domain) = lower(split_part(p_user_name, '@', 2))
                              limit 1), 'member');

  insert into scim_users (org_id, external_id, user_name, given_name, family_name,
                          display_name, active, role)
  values (v_org, p_external_id, p_user_name, p_given_name, p_family_name,
          p_display_name, coalesce(p_active, true), v_role)
  on conflict (org_id, lower(user_name)) do update
    set external_id  = coalesce(excluded.external_id, scim_users.external_id),
        given_name   = excluded.given_name,
        family_name  = excluded.family_name,
        display_name = excluded.display_name,
        active       = excluded.active,
        role         = excluded.role,
        updated_at   = now()
  returning * into v_row;

  perform scim_sync_membership(v_org, v_row.user_name, v_row.active, v_row.role);
  return v_row;
end;
$$;

-- Deactivation is the operation that matters. An IdP offboarding somebody
-- sends `active: false` (Entra) or a DELETE (Okta); both must actually remove
-- their access here, not merely mark a row.
create or replace function scim_set_active(p_token_hash text, p_id uuid, p_active boolean)
returns scim_users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := scim_org_for_token(p_token_hash);
  v_row scim_users;
begin
  if v_org is null then
    raise exception 'scim: unauthorized' using errcode = '28000';
  end if;

  update scim_users set active = p_active, updated_at = now()
  where id = p_id and org_id = v_org
  returning * into v_row;

  if v_row.id is null then
    return null;
  end if;

  perform scim_sync_membership(v_org, v_row.user_name, v_row.active, v_row.role);
  return v_row;
end;
$$;

create or replace function scim_delete_user(p_token_hash text, p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := scim_org_for_token(p_token_hash);
  v_row scim_users;
begin
  if v_org is null then
    raise exception 'scim: unauthorized' using errcode = '28000';
  end if;

  delete from scim_users where id = p_id and org_id = v_org returning * into v_row;
  if v_row.id is null then
    return false;
  end if;

  perform scim_sync_membership(v_org, v_row.user_name, false, v_row.role);
  return true;
end;
$$;

-- ============================================================================
-- Membership sync.
--
-- Keeps `memberships` in step with what the directory says. Only ever touches
-- a user who already has an auth account: SCIM can provision somebody who has
-- never signed in, and their membership is created when they first arrive
-- through SSO instead.
--
-- Owners are invisible to the directory, on purpose.
--
-- The IdP does not know who owns the billing relationship, and its default
-- role for a domain is usually "member". Without this rule a routine sync
-- silently demotes the person who created the workspace, and the next
-- deactivation — of anyone — finds no owners left and locks the organization
-- out of its own settings. Ownership is managed in Aegis; the directory
-- manages everyone else.
-- ============================================================================
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

  if exists (
    select 1 from memberships
    where org_id = p_org and user_id = v_user and role = 'owner'
  ) then
    return;
  end if;

  if p_active then
    insert into memberships (org_id, user_id, role)
    values (p_org, v_user, p_role)
    on conflict (org_id, user_id) do update set role = excluded.role;
  else
    delete from memberships where org_id = p_org and user_id = v_user;
  end if;
end;
$$;

-- ============================================================================
-- SSO sign-in.
--
-- Called by the app after Supabase Auth has established the session. Finds the
-- workspace for the caller's verified email domain and admits them, subject to
-- what SCIM says if the workspace requires it.
-- ============================================================================
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
    -- Provisioned and active, or no entry at all: both mean "not entitled"
    -- when the workspace has said the directory is the source of truth.
    if v_scim.id is null or not v_scim.active then
      return null;
    end if;
  end if;

  insert into memberships (org_id, user_id, role)
  values (v_dom.org_id, auth.uid(), coalesce(v_scim.role, v_dom.default_role))
  on conflict (org_id, user_id) do nothing;

  select slug into v_slug from organizations where id = v_dom.org_id;
  return v_slug;
end;
$$;

-- The SCIM functions are reached with the anon key by an identity provider
-- that has no session; the bearer token inside is the credential.
revoke all on function scim_org_for_token(text) from public;
revoke all on function scim_sync_membership(uuid, text, boolean, org_role) from public;
grant execute on function scim_list_users(text, text, int, int)  to anon, authenticated;
grant execute on function scim_count_users(text, text)           to anon, authenticated;
grant execute on function scim_get_user(text, uuid)              to anon, authenticated;
grant execute on function scim_put_user(text, text, text, text, text, text, boolean, org_role)
                                                                 to anon, authenticated;
grant execute on function scim_set_active(text, uuid, boolean)   to anon, authenticated;
grant execute on function scim_delete_user(text, uuid)           to anon, authenticated;
grant execute on function sso_claim_membership()                 to authenticated;

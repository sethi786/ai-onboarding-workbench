-- ============================================================================
-- 0013 — Know who your colleagues are, and route reviews to them.
--
-- Found by auditing a 3,000-user Copilot rollout from the organization's side
-- rather than the engine's. Two problems, and the first causes the second.
--
-- Nobody can see who is in their workspace. `auth.users` is not readable
-- through RLS, so the members screen renders a truncated UUID for every
-- person — `a3f9c2b1…`. That is unusable at three people and absurd at three
-- thousand.
--
-- And because there is no way to name a colleague, there is no way to route
-- work to one. A review's owner is free text: somebody types "Sam Reyes" into
-- a box, nothing connects it to a member, no view shows a reviewer what is
-- waiting for them, and fifteen review teams coordinate in email — which is
-- the work this product exists to replace.
--
-- `profiles` mirrors the identity fields we are allowed to show colleagues.
-- `team_assessments.owner_user_id` makes an assignment a reference rather than
-- a string.
-- ============================================================================

create table if not exists profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Granted explicitly rather than relying on the project's default privileges,
-- so this migration stands on its own and the reachable surface is stated
-- where the policies are. RLS below is what actually decides who sees what.
grant select on profiles to authenticated;
grant update (full_name) on profiles to authenticated;

/**
 * You can see a profile if it is yours, or if you share a workspace with them.
 *
 * Deliberately not "any authenticated user": an email address is personal
 * data, and a governance product that leaked its own users' addresses across
 * tenants would be failing the review it sells.
 */
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from memberships m
      where m.user_id = profiles.id
        and m.org_id in (select auth_org_ids())
    )
  );

drop policy if exists profiles_update_self on profiles;
create policy profiles_update_self on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- Kept in step by the auth system rather than by application code, so a user
-- created by SSO, by SCIM, or by a password signup all arrive the same way.
create or replace function sync_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name',
                         new.raw_user_meta_data ->> 'name', '')), '')
  )
  on conflict (id) do update
    set email      = excluded.email,
        full_name  = coalesce(excluded.full_name, profiles.full_name),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists sync_profile_on_auth_user on auth.users;
create trigger sync_profile_on_auth_user
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute function sync_profile_from_auth();

-- Backfill anybody who already exists.
insert into profiles (id, email)
select u.id, u.email from auth.users u
on conflict (id) do nothing;

-- ------------------------------------------------------------- assignment
alter table team_assessments
  add column if not exists owner_user_id uuid references auth.users (id) on delete set null;

create index if not exists team_assessments_owner_idx
  on team_assessments (owner_user_id) where owner_user_id is not null;

/**
 * Everything assigned to the caller that is still open, across every workspace
 * they belong to.
 *
 * A reviewer's first question on signing in is "what needs me?", and answering
 * it required joining assessments to evaluations to organizations — which RLS
 * allows but which no page was doing. Returned as one call so the dashboard
 * does not fan out per evaluation.
 */
create or replace function my_open_reviews()
returns table (
  org_slug        text,
  org_name        text,
  evaluation_id   uuid,
  evaluation_name text,
  team_id         text,
  decision        text,
  due_date        text,
  updated_at      timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select o.slug, o.name, e.id, e.name, ta.team_id, ta.decision, ta.due_date, ta.updated_at
  from team_assessments ta
  join evaluations   e on e.id = ta.evaluation_id
  join organizations o on o.id = ta.org_id
  where ta.owner_user_id = auth.uid()
    -- Signed off is not outstanding. "Needs Remediation" very much is.
    and ta.decision not in ('Approved', 'Approved with Conditions')
    and exists (select 1 from memberships m where m.org_id = ta.org_id and m.user_id = auth.uid())
  order by ta.due_date nulls last, ta.updated_at desc
$$;

revoke all on function my_open_reviews() from public;
grant execute on function my_open_reviews() to authenticated;

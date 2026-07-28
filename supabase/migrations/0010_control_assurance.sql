-- ============================================================================
-- 0010 — Control assurance.
--
-- We sell "your controls, evidenced". A customer is entitled to ask the same of
-- us, and the honest answer has to be checkable rather than asserted. This
-- function reports the live state of the platform's own controls — read from
-- the catalog at the moment of asking, not from a page somebody wrote once.
--
-- SECURITY DEFINER because pg_policies is not readable by the app role. It
-- returns counts and booleans about the schema only: no tenant data passes
-- through it, and it takes no arguments, so there is nothing to inject.
-- ============================================================================

create or replace function control_assurance()
returns table (
  control text,
  detail  text,
  passing boolean
)
language sql
stable
security definer
set search_path = public
as $$
  -- Every tenant table has row-level security switched on.
  select
    'Row-level security enabled'::text,
    format('%s of %s tenant tables', count(*) filter (where c.relrowsecurity), count(*))::text,
    bool_and(c.relrowsecurity)
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relname in (
      'organizations','memberships','invitations','evaluations','team_assessments',
      'evidence_links','workflow_stages','generated_reports','audit_events'
    )

  union all

  -- The audit trail has no UPDATE or DELETE policy, so RLS denies both.
  select
    'Audit trail is append-only'::text,
    format('%s write policies, 0 amend policies expected', count(*) filter (where cmd = 'INSERT'))::text,
    count(*) filter (where cmd in ('UPDATE','DELETE','ALL')) = 0
  from pg_policies
  where schemaname = 'public' and tablename = 'audit_events'

  union all

  -- Decisions are controlled by a trigger, not only by application code.
  select
    'Separation of duties enforced in the database'::text,
    coalesce(
      (select 'trigger ' || tgname from pg_trigger
       where tgrelid = 'team_assessments'::regclass
         and tgname = 'team_assessments_authorship'),
      'no trigger found')::text,
    exists (
      select 1 from pg_trigger
      where tgrelid = 'team_assessments'::regclass
        and tgname = 'team_assessments_authorship'
    )

  union all

  -- Membership resolution runs SECURITY DEFINER, which is what lets RLS
  -- policies check membership without recursing into the memberships table.
  select
    'Tenant resolution is privilege-isolated'::text,
    format('%s security-definer helpers', count(*))::text,
    count(*) >= 2
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prosecdef
    and p.proname in ('auth_org_ids','has_org_role');
$$;

revoke all on function control_assurance() from public;
grant execute on function control_assurance() to authenticated;

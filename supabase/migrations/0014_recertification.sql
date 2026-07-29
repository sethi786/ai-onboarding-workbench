-- ============================================================================
-- 0014 — Clearances expire.
--
-- A review is a statement about a tool at a moment: these controls were in
-- place, this data was in scope, this vendor had these terms. Tools change.
-- Copilot gains a connector, a vendor adds a subprocessor, a pilot becomes a
-- company-wide rollout — and an approval signed eighteen months ago goes on
-- reading exactly like one signed yesterday.
--
-- Aegis already requires its own customers to set a recertification cadence:
-- ag-ctl-8 ("a recertification date is set at which the agent's permissions and
-- continued existence are re-approved") and cn-ctl-8 say so in as many words.
-- Not doing it here was the product failing the control it sells, which is the
-- least forgivable kind of gap for a governance tool.
--
-- Cadence is risk-proportionate, matching how the rest of the engine behaves:
-- Critical 3 months, High 6, Medium 12, Low 24. Held in
-- workbench/engine/recertification.ts; this schema only records the outcome.
-- ============================================================================

alter table evaluations
  -- yyyy-mm-dd the current clearance runs out. Null = never certified.
  add column if not exists review_valid_until date,
  -- When the clearance was granted, for the audit trail and the document.
  add column if not exists certified_at timestamptz,
  add column if not exists certified_by uuid references auth.users (id) on delete set null;

-- The dashboard asks "what is expiring?" on every load, and a portfolio of a
-- few hundred tools should not table-scan to answer it.
create index if not exists evaluations_valid_until_idx
  on evaluations (org_id, review_valid_until)
  where review_valid_until is not null;

/**
 * Tools whose clearance has run out or is about to, newest expiry first.
 *
 * `p_within_days` is the look-ahead window: 0 returns only what has already
 * expired, 30 returns that plus what expires within the month. RLS on
 * `evaluations` already restricts this to the caller's workspaces, so this is
 * a convenience rather than a privilege — hence no SECURITY DEFINER.
 */
create or replace function expiring_evaluations(p_org uuid, p_within_days int default 30)
returns table (
  id               uuid,
  name             text,
  platform         text,
  environment      text,
  review_valid_until date,
  days_remaining   int
)
language sql
stable
as $$
  select e.id, e.name, e.platform, e.environment, e.review_valid_until,
         (e.review_valid_until - current_date)::int
  from evaluations e
  where e.org_id = p_org
    and e.review_valid_until is not null
    and e.review_valid_until <= current_date + make_interval(days => greatest(p_within_days, 0))
  order by e.review_valid_until
$$;

grant execute on function expiring_evaluations(uuid, int) to authenticated;

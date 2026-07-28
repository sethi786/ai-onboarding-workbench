-- ============================================================================
-- 0009 — Separation of duties on review decisions.
--
-- Until now the person who filled in an assessment could also record its
-- decision. That is the single most basic control in any approval process —
-- maker/checker — and this product sells approval processes. Failing it in our
-- own workflow is not a gap, it is a contradiction.
--
-- Enforced by a trigger rather than in the server action. An action-level check
-- is a suggestion: anything holding a valid token and talking to PostgREST
-- directly bypasses it. A trigger is the control.
-- ============================================================================

alter table team_assessments
  -- Who did the work, and who signed it off. Separate on purpose.
  add column if not exists authored_by uuid references auth.users(id) on delete set null,
  add column if not exists decided_by  uuid references auth.users(id) on delete set null,
  add column if not exists decided_at  timestamptz;

alter table organizations
  -- Off by default because a solo workspace cannot satisfy it, and a control
  -- that makes the product unusable for its smallest customers gets switched
  -- off wholesale rather than respected. The UI recommends turning it on as
  -- soon as a second member joins.
  add column if not exists require_separation_of_duties boolean not null default false;

comment on column organizations.require_separation_of_duties is
  'When true, the reviewer who last edited an assessment cannot record its decision.';

-- Stamp authorship on every write, so the trigger has something to compare.
create or replace function stamp_assessment_authorship()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requires boolean;
begin
  -- A decision moving from unset (or changing) is the event being controlled.
  if new.decision is distinct from coalesce(old.decision, 'Not Reviewed')
     and new.decision <> 'Not Reviewed' then

    select require_separation_of_duties into v_requires
    from organizations where id = new.org_id;

    if coalesce(v_requires, false)
       and old.authored_by is not null
       and old.authored_by = auth.uid() then
      raise exception
        'Separation of duties: % cannot approve an assessment they authored. Another reviewer must record this decision.',
        coalesce((select email from auth.users where id = auth.uid()), 'this reviewer')
        using errcode = 'check_violation';
    end if;

    new.decided_by := auth.uid();
    new.decided_at := now();
  else
    -- Ordinary edit: this person is now the author of record.
    new.authored_by := coalesce(auth.uid(), new.authored_by);
  end if;

  return new;
end;
$$;

drop trigger if exists team_assessments_authorship on team_assessments;
create trigger team_assessments_authorship
  before insert or update on team_assessments
  for each row execute function stamp_assessment_authorship();

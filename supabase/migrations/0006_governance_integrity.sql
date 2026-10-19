-- Preserve existing evidence and assessments, but require explicit scope review.
begin;

alter table evaluations add column scope_revision integer not null default 1 check (scope_revision > 0);
alter table team_assessments add column scope_revision integer not null default 0 check (scope_revision >= 0);
alter table evidence_links add column scope_revision integer not null default 0 check (scope_revision >= 0);
alter table evidence_links add column evidence_id text not null default '';
alter table evidence_links add column expires_on date;

-- NOT VALID preserves legacy rows for correction; all new/updated rows are checked.
alter table team_assessments add constraint assessment_score_range check (score between -1 and 5) not valid;
alter table team_assessments add constraint assessment_decision_valid check (decision in ('Not Reviewed', 'Approved', 'Approved with Conditions', 'Needs Remediation', 'Blocked')) not valid;
alter table team_assessments add constraint assessment_maps_valid check (jsonb_typeof(checked_controls) = 'object' and jsonb_typeof(checked_evidence) = 'object' and jsonb_typeof(active_blockers) = 'object') not valid;
alter table evidence_links add constraint evidence_url_safe check (url ~* '^https?://[^/@[:space:]]+([/:?#]|$)' and length(url) <= 2048 and url !~* '^https?://[^/]*@') not valid;
alter table workflow_stages add constraint workflow_status_valid check (status in ('Not Started', 'In Progress', 'Complete', 'Blocked', 'Skipped')) not valid;
alter table workflow_stages add constraint workflow_decision_valid check (decision in ('Not Reviewed', 'Approved', 'Approved with Conditions', 'Needs Remediation', 'Blocked')) not valid;

create function maintain_evaluation_scope() returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.scope_revision := 1;
  else
    if new.id is distinct from old.id or new.org_id is distinct from old.org_id or new.created_by is distinct from old.created_by then
      raise exception 'Evaluation identity and ownership cannot be changed';
    end if;
    -- Any profile change except its display name/status invalidates prior reviews.
    if (to_jsonb(new) - array['name','status','updated_at','scope_revision']) is distinct from
       (to_jsonb(old) - array['name','status','updated_at','scope_revision']) then
      new.scope_revision := old.scope_revision + 1;
    else
      new.scope_revision := old.scope_revision;
    end if;
  end if;
  return new;
end;
$$;
create trigger evaluation_scope before insert or update on evaluations for each row execute function maintain_evaluation_scope();

create function protect_review_identity() returns trigger language plpgsql set search_path = public as $$
declare current_revision integer;
begin
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id or new.org_id is distinct from old.org_id or new.evaluation_id is distinct from old.evaluation_id then
      raise exception 'Review identity and parent cannot be changed';
    end if;
    if (to_jsonb(new)->>'team_id') is distinct from (to_jsonb(old)->>'team_id') or
       (to_jsonb(new)->>'stage_key') is distinct from (to_jsonb(old)->>'stage_key') or
       (to_jsonb(new)->>'created_by') is distinct from (to_jsonb(old)->>'created_by') then
      raise exception 'Review ownership and key cannot be changed';
    end if;
  end if;
  -- Serialize scope acknowledgement with profile edits, including concurrent requests.
  select scope_revision into current_revision from evaluations where id = new.evaluation_id for update;
  if tg_table_name in ('team_assessments', 'evidence_links') then
    if tg_op = 'INSERT' then
      if new.scope_revision not in (0, current_revision) then raise exception 'Scope changed; reload before saving'; end if;
      -- New assessments stay unconfirmed (0) until explicit scope acknowledgement.
      -- Evidence is tied to the revision checked when it was attached.
      if tg_table_name = 'evidence_links' then new.scope_revision := current_revision; end if;
    elsif new.scope_revision is distinct from old.scope_revision and new.scope_revision <> current_revision then
      raise exception 'Scope changed; reload before saving';
    end if;
    if tg_table_name = 'team_assessments' and tg_op = 'UPDATE' then
      if new.scope_revision is distinct from old.scope_revision and new.decision in ('Approved', 'Approved with Conditions') then
        new.decision := 'Not Reviewed';
      end if;
    end if;
  end if;
  return new;
end;
$$;
create trigger assessment_identity before insert or update on team_assessments for each row execute function protect_review_identity();
create trigger evidence_identity before insert or update on evidence_links for each row execute function protect_review_identity();
create trigger workflow_identity before insert or update on workflow_stages for each row execute function protect_review_identity();
create trigger report_identity before insert or update on generated_reports for each row execute function protect_review_identity();

-- Workflow creation is part of the evaluation transaction, so partial setup cannot look successful.
create function seed_evaluation_workflow() returns trigger language plpgsql set search_path = public as $$
begin
  insert into workflow_stages (org_id, evaluation_id, stage_key, ordinal, name)
  select new.org_id, new.id, 'stage-' || ordinal, ordinal, name
  from unnest(array['Intake','Business Case','AI Program Review','Enterprise Architecture','Solution Architecture','Security / SAR','Privacy / PIA','Legal / OGC','QRM / Risk','Data Governance','IAM','Platform / Cloud','DevSecOps','AI Engineering','Agent Governance','Connector Governance','Support Readiness','Adoption / Training','Finance / FinOps','Go / No-Go','Pilot','Production','Monitoring','Recertification','Retirement']) with ordinality as stages(name, ordinal);
  return new;
end;
$$;
create trigger evaluation_workflow after insert on evaluations for each row execute function seed_evaluation_workflow();

-- Repair any evaluations whose earlier non-atomic setup left stages missing.
insert into workflow_stages (org_id, evaluation_id, stage_key, ordinal, name)
select e.org_id, e.id, 'stage-' || s.ordinal, s.ordinal, s.name from evaluations e
cross join unnest(array['Intake','Business Case','AI Program Review','Enterprise Architecture','Solution Architecture','Security / SAR','Privacy / PIA','Legal / OGC','QRM / Risk','Data Governance','IAM','Platform / Cloud','DevSecOps','AI Engineering','Agent Governance','Connector Governance','Support Readiness','Adoption / Training','Finance / FinOps','Go / No-Go','Pilot','Production','Monitoring','Recertification','Retirement']) with ordinality as s(name, ordinal)
on conflict (evaluation_id, stage_key) do nothing;

commit;

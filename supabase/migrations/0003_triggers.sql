-- ============================================================================
-- Clearance AI — 0003 triggers (updated_at + child org integrity)
-- ============================================================================

-- updated_at maintainers
drop trigger if exists trg_org_updated on organizations;
create trigger trg_org_updated before update on organizations
  for each row execute function set_updated_at();

drop trigger if exists trg_eval_updated on evaluations;
create trigger trg_eval_updated before update on evaluations
  for each row execute function set_updated_at();

drop trigger if exists trg_ta_updated on team_assessments;
create trigger trg_ta_updated before update on team_assessments
  for each row execute function set_updated_at();

drop trigger if exists trg_ws_updated on workflow_stages;
create trigger trg_ws_updated before update on workflow_stages
  for each row execute function set_updated_at();

-- Child org_id must match parent evaluation's org_id
drop trigger if exists trg_ta_org on team_assessments;
create trigger trg_ta_org before insert or update on team_assessments
  for each row execute function assert_child_org_matches();

drop trigger if exists trg_el_org on evidence_links;
create trigger trg_el_org before insert or update on evidence_links
  for each row execute function assert_child_org_matches();

drop trigger if exists trg_ws_org on workflow_stages;
create trigger trg_ws_org before insert or update on workflow_stages
  for each row execute function assert_child_org_matches();

drop trigger if exists trg_gr_org on generated_reports;
create trigger trg_gr_org before insert or update on generated_reports
  for each row execute function assert_child_org_matches();

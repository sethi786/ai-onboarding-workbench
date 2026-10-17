-- Reproducible API privileges: do not depend on project-wide default grants.
-- RLS still enforces workspace membership and role for every customer write.
begin;
grant usage on schema public to authenticated, service_role;

revoke all on table organizations, memberships, invitations, evaluations,
  team_assessments, evidence_links, workflow_stages, generated_reports,
  tool_templates, workspace_activity, sales_leads, billing_events,
  billing_checkout_locks from public, anon, authenticated;

grant select on organizations, memberships, invitations, evaluations,
  team_assessments, evidence_links, workflow_stages, generated_reports,
  tool_templates, workspace_activity to authenticated;
grant insert, update, delete on memberships, evaluations, team_assessments,
  evidence_links, workflow_stages, generated_reports to authenticated;
grant update, delete on organizations to authenticated;
-- Organization creation and invitation writes use the validated RPCs only.
-- Activity is trigger-written; customers have no write or truncate privilege.

grant select, insert, update, delete on organizations, memberships, invitations,
  evaluations, team_assessments, evidence_links, workflow_stages,
  generated_reports, tool_templates, workspace_activity, sales_leads,
  billing_events, billing_checkout_locks to service_role;

revoke all on function auth_org_ids(), has_org_role(uuid,org_role[]),
  create_organization(text,text), list_workspace_members(uuid),
  create_workspace_invitation(uuid,text,org_role),
  accept_workspace_invitation(text), revoke_workspace_invitation(uuid)
  from public, anon;
grant execute on function auth_org_ids(), has_org_role(uuid,org_role[]),
  create_organization(text,text), list_workspace_members(uuid),
  create_workspace_invitation(uuid,text,org_role),
  accept_workspace_invitation(text), revoke_workspace_invitation(uuid)
  to authenticated;

revoke all on function claim_checkout(uuid,uuid),
  apply_billing_event(text,text,text,timestamptz),
  submit_sales_lead(text,text,text,text,text) from public, anon, authenticated;
grant execute on function claim_checkout(uuid,uuid),
  apply_billing_event(text,text,text,timestamptz),
  submit_sales_lead(text,text,text,text,text) to service_role;
commit;

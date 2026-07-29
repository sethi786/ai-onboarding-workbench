/**
 * Hand-authored Supabase schema types mirroring supabase/migrations/*.
 * Replace with `npm run gen:types` output once a live project is connected
 * (kept in sync manually until then).
 */
export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';
type Json = Record<string, unknown>;

export interface OrganizationRow {
  id: string;
  slug: string;
  name: string;
  created_by: string;
  stripe_customer_id: string | null;
  plan: string;
  // Document branding (migration 0007). Null until the workspace configures it.
  legal_name: string | null;
  logo_url: string | null;
  brand_color: string | null;
  confidentiality_label: string | null;
  document_footer: string | null;
  // Governance controls (0008, 0009).
  ai_enabled: boolean;
  require_separation_of_duties: boolean;
  created_at: string;
  updated_at: string;
}

export interface MembershipRow {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
}

export interface EvaluationRow {
  id: string;
  org_id: string;
  name: string;
  platform: string;
  tool_type: string;
  tool_category: string;
  use_case: string;
  business_owner: string;
  technical_owner: string;
  executive_sponsor: string;
  target_users: string;
  data_types: string[];
  data_classification: string;
  environment: string;
  model: string;
  agent_enabled: boolean;
  connector_enabled: boolean;
  rag_enabled: boolean;
  external_vendor: boolean;
  client_data: boolean;
  pii: boolean;
  autonomous_actions: boolean;
  self_hosted: boolean;
  status: string;
  source_template_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamAssessmentRow {
  id: string;
  org_id: string;
  evaluation_id: string;
  team_id: string;
  score: number;
  checked_controls: Record<string, boolean>;
  checked_evidence: Record<string, boolean>;
  active_blockers: Record<string, boolean>;
  marked_learned: boolean;
  needs_remediation: boolean;
  requires_formal_approval: boolean;
  notes: string;
  owner: string;
  due_date: string;
  residual_risk: string;
  decision: string;
  updated_at: string;
}

export interface EvidenceLinkRow {
  id: string;
  org_id: string;
  evaluation_id: string;
  team_id: string;
  label: string;
  url: string;
  created_at: string;
}

export interface WorkflowStageRow {
  id: string;
  org_id: string;
  evaluation_id: string;
  stage_key: string;
  ordinal: number;
  name: string;
  status: string;
  owner: string;
  due_date: string;
  evidence: string;
  notes: string;
  blocker: string;
  decision: string;
  updated_at: string;
}

export interface GeneratedReportRow {
  id: string;
  org_id: string;
  evaluation_id: string;
  title: string;
  kind: string;
  content: string;
  created_by: string | null;
  created_at: string;
}

export interface ToolTemplateRow {
  id: string;
  name: string;
  vendor: string;
  platform: string;
  tool_type: string;
  summary: string;
  category: string;
  defaults: Json;
  suggested_assessments: Json;
  is_active: boolean;
  sort_order: number;
}

/** Enterprise identity (migration 0011). */
export interface SsoDomainRow {
  id: string;
  org_id: string;
  domain: string;
  verified_at: string | null;
  verification_token: string;
  default_role: OrgRole;
  /**
   * When true a verified domain alone admits nobody — SCIM must have
   * provisioned them and left them active. This is the setting that makes
   * central offboarding real rather than advisory.
   */
  require_scim: boolean;
  created_by: string | null;
  created_at: string;
}

export interface ScimTokenRow {
  id: string;
  org_id: string;
  name: string;
  token_prefix: string;
  /** SHA-256 hex. The secret itself is never stored. */
  token_hash: string;
  created_by: string | null;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface ScimUserRow {
  id: string;
  org_id: string;
  external_id: string | null;
  user_name: string;
  given_name: string | null;
  family_name: string | null;
  display_name: string | null;
  active: boolean;
  role: OrgRole;
  created_at: string;
  updated_at: string;
}

type TableConfig<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      organizations: TableConfig<OrganizationRow>;
      memberships: TableConfig<MembershipRow>;
      invitations: TableConfig<{
        id: string;
        org_id: string;
        email: string;
        role: OrgRole;
        token: string;
        invited_by: string | null;
        accepted_at: string | null;
        created_at: string;
      }>;
      evaluations: TableConfig<EvaluationRow>;
      team_assessments: TableConfig<TeamAssessmentRow>;
      evidence_links: TableConfig<EvidenceLinkRow>;
      workflow_stages: TableConfig<WorkflowStageRow>;
      generated_reports: TableConfig<GeneratedReportRow>;
      tool_templates: TableConfig<ToolTemplateRow>;
      sso_domains: TableConfig<SsoDomainRow>;
      scim_tokens: TableConfig<ScimTokenRow>;
      scim_users: TableConfig<ScimUserRow>;
    };
    Views: { [_ in never]: never };
    Functions: {
      create_organization: {
        Args: { p_name: string; p_slug: string };
        Returns: string;
      };
      /** Admits an SSO caller to the workspace for their verified email domain. */
      sso_claim_membership: {
        Args: Record<string, never>;
        Returns: string | null;
      };
    };
    Enums: { org_role: OrgRole };
    CompositeTypes: { [_ in never]: never };
  };
};

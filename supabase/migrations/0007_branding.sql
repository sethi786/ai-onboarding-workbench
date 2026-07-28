-- ============================================================================
-- 0007 — Per-workspace document branding.
--
-- Every artifact this tool produces goes into somebody else's approval
-- process: a security questionnaire response, a PIA attachment, a board pack.
-- Those documents need to look like they came from the customer, not from us.
-- These columns are the whole brand: they're stamped onto every generated
-- document header, cover page, and printable export.
--
-- Existing rows get sensible defaults from the app layer (see lib/branding.ts),
-- so nothing here is NOT NULL — an unbranded workspace is a valid state.
-- ============================================================================

alter table organizations
  add column if not exists legal_name           text,
  add column if not exists logo_url             text,
  add column if not exists brand_color          text,
  add column if not exists confidentiality_label text,
  add column if not exists document_footer      text;

comment on column organizations.legal_name is
  'Registered entity name for document cover pages, when it differs from the workspace name.';
comment on column organizations.brand_color is
  'Primary brand colour as #rrggbb. Validated and normalised in lib/branding.ts before write.';
comment on column organizations.logo_url is
  'Absolute https URL to the org logo, embedded in printable exports.';

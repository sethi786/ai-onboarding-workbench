-- Generalize evaluations from "AI tool" to any tool being adopted:
-- SaaS applications, PaaS/cloud services, on-premise software, AI/ML systems,
-- and internal builds.
--
-- `tool_category` scopes which review lenses apply at all (an AI Engineering
-- review is meaningless for a third-party CRM). `self_hosted` marks the cases
-- where the organization owns the runtime, and therefore owns hardening,
-- patching, and supply-chain risk.

alter table evaluations
  add column if not exists tool_category text not null default 'AI / ML system',
  add column if not exists self_hosted   boolean not null default false;

-- Existing rows predate the category and are all AI evaluations, which the
-- default already reflects. Derive self_hosted where the tool type makes the
-- answer unambiguous.
update evaluations
   set self_hosted = true
 where self_hosted = false
   and tool_type in ('Secure developer sandbox', 'Internal AI application');

comment on column evaluations.tool_category is
  'Delivery model: SaaS application | PaaS / cloud service | On-premise software | AI / ML system | Internal build. Scopes lens applicability.';
comment on column evaluations.self_hosted is
  'True when the organization runs the software itself and owns hardening, patching, and supply chain.';

-- Templates carry the same scoping so instantiated evaluations inherit it.
alter table tool_templates
  add column if not exists tool_category text not null default 'AI / ML system',
  add column if not exists self_hosted   boolean not null default false;

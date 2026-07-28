import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { aiPolicyFor } from '@/lib/ai/governance';
import { memberQuota, getPlan } from '@/lib/plans';

/**
 * The platform's own controls, and how we know.
 *
 * We sell "your controls, evidenced", so a customer is entitled to ask the same
 * of us. The distinction that makes this honest rather than marketing is the
 * `evidence` field: some of these are read from the live database catalog at
 * the moment of asking, some are read from live configuration, and some are
 * statements we cannot prove from inside the product. Presenting all three as
 * green ticks would be the exact dishonesty this product exists to catch.
 */

export type EvidenceKind = 'verified' | 'configured' | 'attested';

export interface ControlCheck {
  control: string;
  detail: string;
  status: 'pass' | 'warn' | 'fail';
  /**
   * verified   — tested against the live database just now
   * configured — read from this workspace's live settings
   * attested   — a statement about how we operate; not machine-checkable here
   */
  evidence: EvidenceKind;
  /** What to do when it isn't passing. */
  action?: string;
}

const EVIDENCE_LABEL: Record<EvidenceKind, string> = {
  verified: 'Verified against the database just now',
  configured: 'Read from this workspace’s live settings',
  attested: 'Operational statement — not machine-checked here',
};

export function evidenceLabel(kind: EvidenceKind): string {
  return EVIDENCE_LABEL[kind];
}

export async function runAssurance(orgId: string, plan: string): Promise<ControlCheck[]> {
  const supabase = await createClient();
  const checks: ControlCheck[] = [];

  // --- verified: straight from the catalog -----------------------------------
  const { data: platform, error } = await supabase.rpc('control_assurance');
  if (error || !platform) {
    checks.push({
      control: 'Platform control self-check',
      detail:
        'Could not read the control state. Migration 0010 may not have been applied to this database.',
      status: 'fail',
      evidence: 'verified',
      action: 'Apply supabase/migrations/0010_control_assurance.sql.',
    });
  } else {
    for (const row of platform as { control: string; detail: string; passing: boolean }[]) {
      checks.push({
        control: row.control,
        detail: row.detail,
        status: row.passing ? 'pass' : 'fail',
        evidence: 'verified',
      });
    }
  }

  // --- configured: this workspace's live settings ----------------------------
  const [{ data: org }, { count: members }, { count: auditCount }] = await Promise.all([
    supabase
      .from('organizations')
      .select('require_separation_of_duties')
      .eq('id', orgId)
      .maybeSingle(),
    supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('audit_events').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
  ]);

  const seats = members ?? 0;
  const sod = org?.require_separation_of_duties === true;
  checks.push({
    control: 'Separation of duties on decisions',
    detail: sod
      ? 'On. The reviewer who last edited an assessment cannot record its decision.'
      : seats > 1
        ? `Off, and this workspace has ${seats} members — so it could be enforced.`
        : 'Off. A single-member workspace cannot satisfy it; invite a second reviewer first.',
    status: sod ? 'pass' : seats > 1 ? 'warn' : 'fail',
    evidence: 'configured',
    action: sod
      ? undefined
      : seats > 1
        ? 'Turn it on in Settings → Organization.'
        : 'Invite a second reviewer, then turn it on in Settings → Organization.',
  });

  const ai = await aiPolicyFor(orgId);
  checks.push({
    control: 'AI data-sharing policy',
    detail: ai.allowed
      ? 'AI assistance is on. Every call is logged with the model and a SHA-256 of what was sent.'
      : (ai.reason ?? 'AI assistance is unavailable.'),
    status: 'pass',
    evidence: 'configured',
  });

  checks.push({
    control: 'Audit trail is recording',
    detail:
      auditCount && auditCount > 0
        ? `${auditCount} events recorded for this workspace.`
        : 'No events recorded yet. Events appear as your team works.',
    status: auditCount && auditCount > 0 ? 'pass' : 'warn',
    evidence: 'configured',
  });

  const quota = memberQuota(plan, seats);
  checks.push({
    control: 'Seat usage within plan',
    detail:
      quota.limit === null
        ? `${seats} members, unlimited on ${getPlan(plan).name}.`
        : `${quota.used} of ${quota.limit} seats used on ${getPlan(plan).name}.`,
    status: quota.allowed || quota.limit === null ? 'pass' : 'warn',
    evidence: 'configured',
  });

  // --- attested: honest about what cannot be proved from in here -------------
  checks.push(
    {
      control: 'Encryption in transit and at rest',
      detail: 'TLS on every request; data encrypted at rest by the managed Postgres platform.',
      status: 'pass',
      evidence: 'attested',
    },
    {
      control: 'Service credentials are server-side only',
      detail:
        'The service-role key is ESLint-fenced to scripts and never reaches a browser bundle. Enforced at build time, not observable at runtime.',
      status: 'pass',
      evidence: 'attested',
    },
    {
      control: 'Third-party attestation (SOC 2 / ISO 27001)',
      detail: 'Aligned to the controls; no formal attestation held yet.',
      status: 'warn',
      evidence: 'attested',
      action: 'Say so plainly in security reviews rather than implying a certificate.',
    },
  );

  return checks;
}

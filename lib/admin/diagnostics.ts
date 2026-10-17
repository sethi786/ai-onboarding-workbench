import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { supabaseEnv } from '@/lib/supabase/env';
import { launchChecks } from '@/lib/launch/readiness';
import { requireOperator } from '@/lib/auth/operator';

export type Diagnostic = {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  detail: string;
};

/** Bounded, read-only checks under the operator's ordinary authenticated RLS.
 * No service-role access, customer records, or secrets enter this report.
 */
export async function deploymentDiagnostics(): Promise<Diagnostic[]> {
  await requireOperator();
  const client = await createClient();
  const schema = [
    { table: 'memberships', fields: 'id,org_id,role' },
    { table: 'organizations', fields: 'id,plan,billing_observed_at' },
    { table: 'evaluations', fields: 'id,org_id,scope_revision' },
    { table: 'team_assessments', fields: 'id,org_id,scope_revision' },
    { table: 'evidence_links', fields: 'id,org_id,scope_revision,expires_on' },
    { table: 'workflow_stages', fields: 'id,org_id' },
    { table: 'invitations', fields: 'id,org_id,revoked_at' },
    { table: 'workspace_activity', fields: 'id,org_id,changed_fields' },
    { table: 'generated_reports', fields: 'id,org_id' },
  ] as const;
  const results = await Promise.all(
    schema.map(async ({ table, fields }): Promise<Diagnostic> => {
      try {
        const { error } = await client
          .from(table)
          .select(fields, { head: true })
          .limit(1)
          .abortSignal(AbortSignal.timeout(5000));
        return {
          name: table,
          status: error ? 'fail' : 'pass',
          detail: error
            ? 'Read probe failed. Check connection, grants and migrations through 0009.'
            : 'Database API accepted the expected columns with your session. No records returned.',
        };
      } catch {
        return {
          name: table,
          status: 'fail',
          detail:
            'Database API could not be reached within the check. Retry and inspect provider logs.',
        };
      }
    }),
  );
  const { url, anonKey } = supabaseEnv();
  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/settings`, {
      headers: { apikey: anonKey },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error('Unavailable');
    const settings = await response.json();
    results.unshift({
      name: 'Email and password authentication',
      status:
        settings.external?.email === true &&
        settings.disable_signup !== true &&
        settings.mailer_autoconfirm === false
          ? 'pass'
          : 'fail',
      detail:
        settings.external?.email === true &&
        settings.disable_signup !== true &&
        settings.mailer_autoconfirm === false
          ? 'Provider reports email signup enabled with confirmation required. Email delivery still needs a real test.'
          : 'Enable email signup and require confirmation in Supabase Auth. This check does not test email delivery.',
    });
  } catch {
    results.unshift({
      name: 'Authentication provider',
      status: 'fail',
      detail:
        'The provider settings endpoint could not be reached. Check the project URL and public key.',
    });
  }
  const labels: Record<keyof ReturnType<typeof launchChecks>, string> = {
    authentication: 'Supabase environment',
    payments: 'Stripe environment',
    serviceAccess: 'Server service key',
    contactProtection: 'Enquiry protection',
    identity: 'Business identity',
    domain: 'HTTPS site origin',
    releaseApproved: 'Launch approval flag',
  };
  for (const [key, present] of Object.entries(launchChecks()))
    results.push({
      name: labels[key as keyof typeof labels],
      status: 'pending',
      detail: present
        ? 'Configured. Live acceptance must be recorded separately.'
        : 'Not configured. Complete deployment setup before launch.',
    });
  return results;
}

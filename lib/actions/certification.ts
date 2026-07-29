'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';
import { recordAudit } from '@/lib/audit';
import { nextValidUntil } from '@/workbench/engine/recertification';
import type { RiskLevel } from '@/workbench/types';

export interface ActionResult {
  error?: string;
  validUntil?: string;
}

/**
 * Record a clearance, setting the date it runs out.
 *
 * The cadence is derived from the risk the tool was cleared at rather than
 * chosen freely: a Critical-risk tool cleared on conditions earns three months,
 * a Low-risk one earns two years. Letting the person granting the clearance
 * also pick how long it lasts is how eighteen-month approvals on high-risk
 * tools happen.
 */
export async function certifyEvaluation(
  evalId: string,
  orgId: string,
  orgSlug: string,
  risk: RiskLevel,
): Promise<ActionResult> {
  await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const validUntil = nextValidUntil(today, risk);
  if (!validUntil) return { error: 'Could not work out a clearance date.' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('evaluations')
    .update({
      review_valid_until: validUntil,
      certified_at: new Date().toISOString(),
    })
    .eq('id', evalId)
    .eq('org_id', orgId)
    .select('id');
  if (error) return { error: error.message };
  // An update blocked by RLS returns success with zero rows.
  if (!data || data.length === 0) {
    return { error: 'You don’t have permission to certify this evaluation.' };
  }

  await recordAudit({
    orgId,
    action: 'evaluation.certified',
    summary: `Cleared until ${validUntil} (${risk} risk).`,
    subjectType: 'evaluation',
    subjectId: evalId,
    metadata: { validUntil, risk },
  });
  revalidatePath(`/portal/${orgSlug}/evaluations/${evalId}`, 'layout');
  return { validUntil };
}

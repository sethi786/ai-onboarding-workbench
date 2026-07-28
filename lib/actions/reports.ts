'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';
import { assertFeature, getOrgPlan } from '@/lib/auth/entitlements';

export async function saveReport(
  evalId: string,
  orgId: string,
  orgSlug: string,
  report: { title: string; kind: string; content: string },
): Promise<{ error?: string }> {
  const user = await requireUser();

  // Saved reports are part of the Evidence Factory, so the plan gate belongs
  // here and not only on the page that renders the button.
  const plan = await getOrgPlan(orgId);
  if (plan === null) return { error: 'Workspace not found.' };
  const gate = assertFeature(plan, 'evidenceFactory');
  if (gate) return { error: gate };

  const supabase = await createClient();
  const { error } = await supabase.from('generated_reports').insert({
    org_id: orgId,
    evaluation_id: evalId,
    title: report.title,
    kind: report.kind,
    content: report.content,
    created_by: user.id,
  });
  if (error) return { error: error.message };
  revalidatePath(`/portal/${orgSlug}/evaluations/${evalId}/exports`);
  return {};
}

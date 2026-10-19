'use server';

import { revalidatePath } from 'next/cache';
import { authorizeEvaluation } from '@/lib/auth/evaluation-access';

export async function saveReport(
  evalId: string,
  orgId: string,
  orgSlug: string,
  report: { title: string; kind: string; content: string },
): Promise<{ error?: string }> {
  if (!report || typeof report.title !== 'string' || !report.title.trim() || report.title.length > 200 || typeof report.kind !== 'string' || report.kind.length > 100 || typeof report.content !== 'string' || report.content.length > 500000) return { error: 'Invalid report.' };
  const access = await authorizeEvaluation(evalId, orgSlug, orgId);
  if ('error' in access) return { error: access.error };
  const { supabase, user } = access;
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

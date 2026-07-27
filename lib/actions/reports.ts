'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';

export async function saveReport(
  evalId: string,
  orgId: string,
  orgSlug: string,
  report: { title: string; kind: string; content: string },
): Promise<{ error?: string }> {
  const user = await requireUser();
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

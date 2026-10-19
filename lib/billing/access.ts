import 'server-only';
import { createClient } from '@/lib/supabase/server';

export async function billingWorkspace(orgId: unknown) {
  if (typeof orgId !== 'string' || !/^[a-f\d-]{36}$/i.test(orgId)) return null;
  const db = await createClient();
  const {
    data: { user },
    error: authError,
  } = await db.auth.getUser();
  if (authError || !user) return null;
  const [org, membership] = await Promise.all([
    db.from('organizations').select('*').eq('id', orgId).maybeSingle(),
    db
      .from('memberships')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);
  if (
    org.error ||
    membership.error ||
    !org.data ||
    membership.data?.role !== 'owner'
  )
    return null;
  return { org: org.data, user };
}

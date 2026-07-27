import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/db/types';

/**
 * SERVICE-ROLE client — bypasses RLS. SCRIPTS/SEED ONLY.
 * Never import this from application code (enforced by ESLint no-restricted-imports).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

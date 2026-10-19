import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return new Response('Forbidden', { status: 403 });
  const response = NextResponse.redirect(new URL('/', request.url), {
    status: 303,
  });
  response.headers.set('Cache-Control', 'private, no-store');
  if (!isSupabaseConfigured()) return response;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (!error) return response;
  } catch {
    /* Allow a retry without exposing provider details. */
  }
  const failed = NextResponse.redirect(
    new URL('/portal/account?error=signout', request.url),
    303,
  );
  failed.headers.set('Cache-Control', 'private, no-store');
  return failed;
}

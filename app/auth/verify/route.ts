import { NextResponse } from 'next/server';
import { emailVerification } from '@/lib/auth/email-flow';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { readBody } from '@/lib/server/request-body';

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const finish = (path: string) => {
    const response = NextResponse.redirect(new URL(path, origin), 303);
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  };
  if (request.headers.get('origin') !== origin)
    return new Response('Forbidden', { status: 403 });
  if (!isSupabaseConfigured()) return finish('/launch-status');
  let next = '/portal';
  try {
    if (
      !request.headers
        .get('content-type')
        ?.startsWith('application/x-www-form-urlencoded')
    )
      return new Response('Unsupported form', { status: 415 });
    const form = new URLSearchParams(await readBody(request, 4096));
    const verification = emailVerification(Object.fromEntries(form));
    if (!verification) return finish('/auth/error');
    next = verification.next;
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: verification.token_hash,
      type: verification.type,
    });
    if (!error) return finish(next);
  } catch {
    /* A retry page, never token values or raw provider errors. */
  }
  return finish(`/auth/error?next=${encodeURIComponent(next)}`);
}

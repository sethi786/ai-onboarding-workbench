import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/auth/safe-redirect';
import { emailVerification } from '@/lib/auth/email-flow';
import { isSupabaseConfigured } from '@/lib/supabase/env';

function redirectTo(url: URL) {
  const response = NextResponse.redirect(url);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

/** Handles magic-link, email-confirmation, OAuth, and recovery code exchange. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));
  if (!isSupabaseConfigured())
    return redirectTo(new URL('/launch-status', origin));
  // Token-hash email templates work across devices. Do not consume on GET:
  // email link scanners must not use a customer's one-time confirmation token.
  if (searchParams.has('token_hash')) {
    const verification = emailVerification(Object.fromEntries(searchParams));
    if (verification) {
      const destination = new URL('/auth/confirm', origin);
      for (const [key, value] of Object.entries(verification))
        destination.searchParams.set(key, value);
      return redirectTo(destination);
    }
  } else if (code && code.length <= 2048) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return redirectTo(new URL(next, origin));
    } catch {
      /* Never expose auth codes or provider errors. */
    }
  }
  const failure = new URL('/auth/error', origin);
  failure.searchParams.set('next', next);
  return redirectTo(failure);
}

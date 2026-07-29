import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/auth/safe-redirect';
import { claimSsoMembership } from '@/lib/auth/sso';

/**
 * Handles magic-link, email-confirmation, OAuth, SAML, and recovery exchange.
 *
 * SAML lands here too, and somebody signing in through their employer's
 * identity provider has no invitation and therefore no membership — they would
 * arrive at an empty account picker having done everything right. The claim
 * below puts them into the workspace that owns their verified email domain.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const requestedNext = searchParams.get('next');
  const next = safeNext(requestedNext);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const slug = await claimSsoMembership();
      // Only route into the claimed workspace when the caller wasn't already
      // headed somewhere specific — a deep link they followed before signing
      // in still wins.
      if (slug && !requestedNext) {
        return NextResponse.redirect(`${origin}/portal/${slug}/dashboard`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}

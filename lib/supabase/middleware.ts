import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from './env';
import { safeNext } from '@/lib/auth/safe-redirect';

/**
 * Refreshes the Supabase session cookie on every request (Server Components
 * cannot write cookies) and applies coarse route protection:
 *  - unauthenticated → /portal/*  redirects to /login
 *  - authenticated   → /login,/signup redirects to /portal
 * If Supabase env is absent, auth is skipped so the marketing site still runs.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: use getUser() (verifies the JWT), never getSession() for authz.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPortal = path.startsWith('/portal');
  const isAuthRoute = ['/login', '/signup'].some((p) => path.startsWith(p));

  if (isPortal && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', path + request.nextUrl.search);
    const redirected = NextResponse.redirect(url);
    response.cookies
      .getAll()
      .forEach((cookie) => redirected.cookies.set(cookie));
    return redirected;
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    const target = new URL(
      safeNext(request.nextUrl.searchParams.get('next')),
      request.url,
    );
    const redirected = NextResponse.redirect(target);
    response.cookies
      .getAll()
      .forEach((cookie) => redirected.cookies.set(cookie));
    return redirected;
  }

  return response;
}

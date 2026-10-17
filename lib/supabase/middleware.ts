import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from './env';
import { safeNext } from '@/lib/auth/safe-redirect';

/**
 * Refreshes the Supabase session cookie on account/workspace requests (Server Components
 * cannot write cookies) and applies coarse route protection:
 *  - unauthenticated → /portal/*  redirects to /login
 *  - authenticated   → /login,/signup redirects to /portal
 * If Supabase env is absent, auth is skipped so the marketing site still runs.
 */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPortal = path === '/portal' || path.startsWith('/portal/');
  const isAdmin = path === '/admin' || path.startsWith('/admin/');
  const isAuthRoute = ['/login', '/signup'].includes(path);
  const needsSession =
    isPortal ||
    isAdmin ||
    isAuthRoute ||
    ['/forgot-password', '/reset-password', '/resend-confirmation'].includes(
      path,
    ) ||
    path.startsWith('/invite/');
  // Marketing pages never refresh a user's session or depend on Auth uptime.
  if (!needsSession) return NextResponse.next({ request });
  let response = NextResponse.next({ request });
  response.headers.set('Cache-Control', 'private, no-store');

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
          response.headers.set('Cache-Control', 'private, no-store');
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: use getUser() (verifies the JWT), never getSession() for authz.
  let user;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    if (isPortal || isAdmin) {
      const unavailable = NextResponse.redirect(
        new URL('/login?error=unavailable', request.url),
      );
      unavailable.headers.set('Cache-Control', 'private, no-store');
      return unavailable;
    }
    return response;
  }

  if ((isPortal || isAdmin) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', path + request.nextUrl.search);
    const redirected = NextResponse.redirect(url);
    redirected.headers.set('Cache-Control', 'private, no-store');
    response.cookies
      .getAll()
      .forEach((cookie) => redirected.cookies.set(cookie));
    return redirected;
  }

  if (isAuthRoute && user) {
    const target = new URL(
      safeNext(request.nextUrl.searchParams.get('next')),
      request.url,
    );
    const redirected = NextResponse.redirect(target);
    redirected.headers.set('Cache-Control', 'private, no-store');
    response.cookies
      .getAll()
      .forEach((cookie) => redirected.cookies.set(cookie));
    return redirected;
  }

  return response;
}

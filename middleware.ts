import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Everything except static assets, image files, and the SCIM API.
  //
  // SCIM is called by an identity provider, not a browser: it carries a bearer
  // token, holds no cookies, and authenticates itself inside the route. Running
  // a session refresh on it costs a round trip to the auth server on every
  // provisioning request and sets response cookies nothing will ever read.
  matcher: [
    '/((?!api/scim|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

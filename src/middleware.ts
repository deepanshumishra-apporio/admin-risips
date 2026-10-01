import { NextResponse, type NextRequest } from 'next/server';

/**
 * A fast first gate: no session cookie, no portal. It only checks presence —
 * the edge cannot validate a token — so every page still verifies the session
 * with the API (`authedRequest`), which is the real check.
 *
 * Both cookie names are accepted so this file needs no server-only import.
 */
const SessionCookies = ['__Host-risips_admin', 'risips_admin'];

export function middleware(request: NextRequest): NextResponse {
  const signedIn = SessionCookies.some((name) => request.cookies.has(name));
  if (signedIn) return NextResponse.next();

  const target = new URL('/signin', request.url);
  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (next !== '/') target.searchParams.set('next', next);
  return NextResponse.redirect(target);
}

export const config = {
  // Everything except sign-in, the session-expiry route and static assets.
  matcher: ['/((?!signin|auth|_next/static|_next/image|icon.svg|favicon.ico).*)'],
};

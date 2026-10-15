import { NextResponse, type NextRequest } from 'next/server';

/**
 * A fast first gate: no session cookie, no portal. It only checks presence —
 * the edge cannot validate a token — so every page still verifies the session
 * with the API (`authedRequest`), which is the real check.
 *
 * Only this environment's cookie name counts (mirrors `SessionCookieName`,
 * which is server-only and cannot be imported here): in production a planted
 * plain `risips_admin` cookie must not pass for the `__Host-` one.
 */
const SessionCookie = process.env.NODE_ENV === 'production' ? '__Host-risips_admin' : 'risips_admin';

export function middleware(request: NextRequest): NextResponse {
  const signedIn = Boolean(request.cookies.get(SessionCookie)?.value);
  if (signedIn) return NextResponse.next();

  const target = new URL('/signin', request.url);
  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (next !== '/') target.searchParams.set('next', next);
  return NextResponse.redirect(target);
}

export const config = {
  // Everything except sign-in, the session-expiry route and static assets.
  // Each exclusion is anchored to a whole path segment: unanchored, a future
  // `/authorizations` or `/signin-logs` page would silently skip this gate.
  matcher: ['/((?!(?:signin|auth|_next/static|_next/image)(?:/|$)|(?:icon\\.svg|favicon\\.ico)$).*)'],
};

import { NextResponse, type NextRequest } from 'next/server';

import { middlewareRedirect } from '@/lib/redirect';

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
  if (signedIn) return onboardingSection(request);

  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  return middlewareRedirect(request, '/signin', next === '/' ? undefined : { next });
}

/**
 * HUF onboarding (/onboarding/hufs) and company onboarding (/onboarding/companies) are separate screens built from the
 * same pages: each file under /onboarding/companies re-exports its /onboarding/hufs twin, and the `x-client-section`
 * header set here tells the page which section it is in (always set, so a header sent by the browser never counts).
 * They are real routes, not rewrites: a middleware rewrite was proxied by full URL and failed behind Caddy, and a
 * config rewrite made both sections one route, so switching sections showed the other section's list for a few seconds.
 */
function onboardingSection(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const company = pathname === '/onboarding/companies' || pathname.startsWith('/onboarding/companies/');
  const huf = pathname === '/onboarding/hufs' || pathname.startsWith('/onboarding/hufs/');
  if (!company && !huf) return NextResponse.next();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-client-section', company ? 'companies' : 'hufs');
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Everything except sign-in, the session-expiry route, the karta's HUF consent
  // page (a link with its own token, opened by someone with no staff session)
  // and static assets. Each exclusion is anchored to a whole path segment:
  // unanchored, a future `/authorizations` or `/signin-logs` page would silently
  // skip this gate.
  matcher: ['/((?!(?:signin|auth|huf-consent|_next/static|_next/image)(?:/|$)|(?:icon\\.svg|favicon\\.ico)$).*)'],
};

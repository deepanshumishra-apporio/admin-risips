import { NextResponse, type NextRequest } from 'next/server';

import { apiRequest } from '@/lib/api/client';
import { SessionCookieName, sessionCookieAttributes } from '@/lib/auth/session-cookie';

/**
 * Where a server component sends a dead session. Components cannot write
 * cookies, so this route clears the stale one before sign-in — otherwise the
 * middleware would keep treating the browser as signed in.
 *
 * It acts only when the browser sent the cookie. The cookie is SameSite=Strict,
 * so a link from another site arrives without it — that is how a third-party
 * page could otherwise sign staff out by linking here. When it does act, the
 * session is also revoked on the API, not just forgotten by this browser.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const target = new URL('/signin', request.url);
  target.searchParams.set('reason', request.nextUrl.searchParams.get('reason') === 'mfa' ? 'mfa' : 'expired');
  const response = NextResponse.redirect(target);

  const token = request.cookies.get(SessionCookieName)?.value;
  if (token) {
    // Best effort: the session is usually already dead, which is why we are here.
    await apiRequest<void>('/sessions/current', { method: 'DELETE', token }).catch(() => undefined);
    // Same attributes as when it was set; see clearSessionToken.
    response.cookies.set(SessionCookieName, '', { ...sessionCookieAttributes(), maxAge: 0 });
  }
  return response;
}

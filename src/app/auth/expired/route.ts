import { NextResponse, type NextRequest } from 'next/server';

import { SessionCookieName } from '@/lib/auth/session-cookie';

/**
 * Where a server component sends a dead session. Components cannot write
 * cookies, so this route clears the stale one before sign-in — otherwise the
 * middleware would keep treating the browser as signed in.
 */
export function GET(request: NextRequest): NextResponse {
  const target = new URL('/signin', request.url);
  target.searchParams.set('reason', request.nextUrl.searchParams.get('reason') === 'mfa' ? 'mfa' : 'expired');
  const response = NextResponse.redirect(target);
  response.cookies.delete(SessionCookieName);
  return response;
}

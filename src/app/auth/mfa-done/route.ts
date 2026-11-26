import { type NextRequest, NextResponse } from 'next/server';

import { apiRequest } from '@/lib/api/client';
import { SessionCookieName, sessionCookieAttributes } from '@/lib/auth/session-cookie';
import { redirectTo } from '@/lib/redirect';
import type { StaffSessionState } from '@/types/admin-api.types';
import { safeNextPath } from '@/utils/safe-redirect';

/**
 * Where "Continue" goes after two-factor setup, once the recovery codes are saved. Setting up doesn't renew the
 * session cookie itself: a server action that writes a cookie makes Next re-render the sign-in page, which sends a
 * verified session straight on and the recovery codes vanished unseen. This renews it with the full session life.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SessionCookieName)?.value;
  if (!token) return redirectTo('/signin');
  let state: StaffSessionState;
  try {
    state = await apiRequest<StaffSessionState>('/sessions/current', { token });
  } catch {
    return redirectTo('/auth/expired');
  }
  if (state.mfa !== 'VERIFIED') return redirectTo('/signin/mfa');
  const response = redirectTo(state.mustChangePassword ? '/signin/password' : safeNextPath(request.nextUrl.searchParams.get('next') ?? undefined));
  response.cookies.set(SessionCookieName, token, { ...sessionCookieAttributes(), expires: new Date(state.expiresAt) });
  return response;
}

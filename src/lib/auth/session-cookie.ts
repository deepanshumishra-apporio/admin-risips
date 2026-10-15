import 'server-only';

import { cookies } from 'next/headers';

import { Config } from '@/lib/config';

/**
 * The staff session token lives only in this cookie: httpOnly, so no script on
 * the page can read it, and SameSite=Strict, so no other site can make the
 * browser send it. Every API call is made by the Next server on the staff
 * member's behalf.
 *
 * The __Host- prefix (production only, as it requires Secure) pins the cookie
 * to this exact origin with no Domain attribute, so a sibling subdomain cannot
 * plant or overwrite it.
 */
export const SessionCookieName = process.env.NODE_ENV === 'production' ? '__Host-risips_admin' : 'risips_admin';

export async function readSessionToken(): Promise<string | null> {
  return (await cookies()).get(SessionCookieName)?.value ?? null;
}

/** The attributes the cookie is written with — a deletion must repeat them. */
export function sessionCookieAttributes() {
  return { httpOnly: true, secure: Config.secureCookies, sameSite: 'strict' as const, path: '/' };
}

/** Only callable from a server action or route handler. */
export async function writeSessionToken(token: string, expiresAt: string): Promise<void> {
  (await cookies()).set(SessionCookieName, token, {
    ...sessionCookieAttributes(),
    expires: new Date(expiresAt),
  });
}

/**
 * Only callable from a server action or route handler.
 *
 * Expired by re-setting it with the same attributes, not `cookies().delete()`:
 * that emits no `Secure`, and a browser ignores any `__Host-` Set-Cookie
 * without it — so in production sign-out left the session cookie in place.
 */
export async function clearSessionToken(): Promise<void> {
  (await cookies()).set(SessionCookieName, '', { ...sessionCookieAttributes(), maxAge: 0 });
}

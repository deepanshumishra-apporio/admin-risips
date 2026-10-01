import 'server-only';

import { redirect } from 'next/navigation';
import { cache } from 'react';

import { apiRequest } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { readSessionToken } from '@/lib/auth/session-cookie';
import type { Permission, StaffMe } from '@/types/admin-api.types';

type AuthedOptions = Omit<NonNullable<Parameters<typeof apiRequest>[1]>, 'token'>;

/**
 * An API call as the signed-in staff member, from a server component.
 *
 * Session problems end the render with a redirect instead of an error page:
 * an expired session goes to sign-in (through /auth/expired, which can clear
 * the cookie — a server component cannot), a pending MFA to the code screen,
 * and a password the owner has not yet replaced to the change screen.
 * Anything else, a 403 included, is thrown for the page to handle.
 */
export async function authedRequest<T>(path: string, options: AuthedOptions = {}): Promise<T> {
  const token = await readSessionToken();
  if (!token) redirect('/signin');
  try {
    return await apiRequest<T>(path, { ...options, token });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.isUnauthenticated) redirect('/auth/expired');
      if (error.code === 'MFA_REQUIRED') redirect('/signin/mfa');
      if (error.code === 'PASSWORD_CHANGE_REQUIRED') redirect('/signin/password');
    }
    throw error;
  }
}

/** The signed-in staff member, fetched once per request however many components ask. */
export const currentStaff = cache(async (): Promise<StaffMe> => {
  const me = await authedRequest<StaffMe>('/me');
  if (me.mustChangePassword) redirect('/signin/password');
  return me;
});

export async function hasPermission(permission: Permission): Promise<boolean> {
  return (await currentStaff()).permissions.includes(permission);
}

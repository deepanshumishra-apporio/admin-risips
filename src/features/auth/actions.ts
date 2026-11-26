'use server';

import { redirect } from 'next/navigation';
import QRCode from 'qrcode';

import { apiRequest } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { landingFor } from '@/lib/auth/landing';
import { clearSessionToken, readSessionToken, writeSessionToken } from '@/lib/auth/session-cookie';
import type { MfaSetup, StaffMe, StaffSession, StaffSessionState } from '@/types/admin-api.types';
import { safeNextPath } from '@/utils/safe-redirect';

export type FormState = { error: string | null };
/** After the authenticator is set up: the recovery codes to save, and where to go once they are saved. */
export type MfaVerifyState = FormState & { recoveryCodes?: string[]; continueTo?: string };

const field = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
};

const message = (error: unknown): string =>
  error instanceof ApiError ? error.message : 'Something went wrong. Try again.';

/**
 * Where a finished sign-in goes. A deep link (`?next=/support/…`) is honoured;
 * otherwise straight to the staff member's landing page, not to `/`, which
 * would only look them up again and redirect a second time. If the lookup
 * fails, `/` still gets them there.
 */
async function destination(token: string, next: string): Promise<string> {
  try {
    const me = await apiRequest<StaffMe>('/me', { token });
    if (me.mustChangePassword) return '/signin/password';
    return next === '/' ? landingFor(me.permissions) : next;
  } catch {
    return next;
  }
}

// --- password -------------------------------------------------------------------

export async function signIn(_previous: FormState, form: FormData): Promise<FormState> {
  const email = field(form, 'email').trim().toLowerCase();
  const password = field(form, 'password');
  const next = safeNextPath(field(form, 'next'));
  if (!email || !password) return { error: 'Enter your email and password.' };

  let session: StaffSession;
  try {
    session = await apiRequest<StaffSession>('/sessions', { method: 'POST', body: { email, password } });
  } catch (error) {
    if (error instanceof ApiError && error.code === 'ACCOUNT_LOCKED') {
      const minutes = Math.ceil(Number(error.details['retryAfterSeconds'] ?? 900) / 60);
      return { error: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.` };
    }
    if (error instanceof ApiError && error.status === 429) return { error: 'Too many attempts. Wait a minute and try again.' };
    return { error: message(error) };
  }

  await writeSessionToken(session.accessToken, session.expiresAt);
  if (session.mfa !== 'VERIFIED') redirect(`/signin/mfa?next=${encodeURIComponent(next)}`);
  redirect(await destination(session.accessToken, next));
}

// --- MFA -------------------------------------------------------------------------

export type MfaSetupState = { error: string | null; qrSvg: string | null; secret: string | null };

/** Start enrolment: a fresh secret, rendered as a QR code on the server. */
export async function startMfaSetup(): Promise<MfaSetupState> {
  const token = await readSessionToken();
  if (!token) redirect('/signin');
  try {
    const setup = await apiRequest<MfaSetup>('/sessions/mfa/setup', { method: 'POST', token });
    const qrSvg = await QRCode.toString(setup.otpauthUri, { type: 'svg', margin: 1, width: 196, errorCorrectionLevel: 'M' });
    return { error: null, qrSvg, secret: setup.secret };
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthenticated) redirect('/auth/expired');
    return { error: message(error), qrSvg: null, secret: null };
  }
}

export async function verifyMfa(_previous: MfaVerifyState, form: FormData): Promise<MfaVerifyState> {
  const code = field(form, 'code').replace(/\s+/g, '');
  const next = safeNextPath(field(form, 'next'));
  if (field(form, 'mode') === 'recovery') {
    if (!/^[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}$/.test(code)) return { error: 'Enter one of your recovery codes, like K7QM-4XRT.' };
  } else if (!/^\d{6}$/.test(code)) return { error: 'Enter the 6-digit code from your authenticator app.' };

  const token = await readSessionToken();
  if (!token) redirect('/signin');

  let state: StaffSessionState;
  try {
    state = await apiRequest<StaffSessionState>('/sessions/mfa/verify', { method: 'POST', token, body: { code } });
  } catch (error) {
    // Too many wrong codes revokes the session outright: start again.
    if (error instanceof ApiError && error.isUnauthenticated) redirect('/auth/expired?reason=mfa');
    if (error instanceof ApiError && error.code === 'MFA_ALREADY_VERIFIED') redirect(next);
    return { error: message(error) };
  }

  // Just set up: the recovery codes are shown once, before going on. The cookie is renewed by /auth/mfa-done when
  // they press Continue: writing it here makes Next re-render this page, which moves a verified session on at once.
  if (state.recoveryCodes?.length) {
    const to = state.mustChangePassword ? '/signin/password' : await destination(token, next);
    return { error: null, recoveryCodes: state.recoveryCodes, continueTo: `/auth/mfa-done?next=${encodeURIComponent(to)}` };
  }
  // Same token, now a full session with a longer life.
  await writeSessionToken(token, state.expiresAt);
  redirect(state.mustChangePassword ? '/signin/password' : await destination(token, next));
}

/** Ten new recovery codes from the profile (the old ones stop working); needs a current authenticator code. */
export async function renewRecoveryCodes(_previous: MfaVerifyState, form: FormData): Promise<MfaVerifyState> {
  const code = field(form, 'code').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(code)) return { error: 'Enter the 6-digit code from your authenticator app.' };
  const token = await readSessionToken();
  if (!token) redirect('/signin');
  try {
    const r = await apiRequest<{ recoveryCodes: string[] }>('/me/recovery-codes', { method: 'POST', token, body: { code } });
    return { error: null, recoveryCodes: r.recoveryCodes };
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthenticated) redirect('/auth/expired');
    return { error: message(error) };
  }
}

// --- password change & sign-out ------------------------------------------------

export async function changePassword(_previous: FormState, form: FormData): Promise<FormState> {
  const currentPassword = field(form, 'currentPassword');
  const newPassword = field(form, 'newPassword');
  if (!currentPassword || !newPassword) return { error: 'Fill in both passwords.' };
  if (newPassword !== field(form, 'confirmPassword')) return { error: 'The new passwords do not match.' };

  const token = await readSessionToken();
  if (!token) redirect('/signin');
  try {
    await apiRequest<void>('/me/password', { method: 'POST', token, body: { currentPassword, newPassword } });
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthenticated) redirect('/auth/expired');
    return { error: message(error) };
  }
  redirect(await destination(token, '/'));
}

export async function signOut(): Promise<void> {
  const token = await readSessionToken();
  if (token) {
    // Best effort: the cookie goes regardless, so a failed call cannot strand
    // someone signed in on this browser.
    await apiRequest<void>('/sessions/current', { method: 'DELETE', token }).catch(() => undefined);
  }
  await clearSessionToken();
  redirect('/signin');
}

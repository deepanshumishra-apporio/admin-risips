'use server';

import { revalidatePath } from 'next/cache';

import { ApiError } from '@/lib/api/errors';
import { authedRequest } from '@/lib/auth/session';

const SipActions = ['sip_pause', 'sip_resume', 'sip_modify', 'sip_cancel', 'redeem'] as const;
export type SipAction = (typeof SipActions)[number];

/** Server actions take their arguments from the browser: check them rather than trust the types. */
const isAction = (value: unknown): value is SipAction => (SipActions as readonly unknown[]).includes(value);

export type OtpResult =
  | { ok: true; expiresIn: number; resendIn: number; sentTo: { mobile: string | null; email: string | null } }
  | { ok: false; error: string };

export type ActionResult =
  | { ok: true; label: string; summary: string; sipId: string; orderRef: string | null }
  | { ok: false; error: string; otpProblem: boolean };

const Uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Step 1: the app backend texts / emails the investor a code for this action. */
export async function sendSipOtp(id: string, action: SipAction): Promise<OtpResult> {
  if (!Uuid.test(id)) return { ok: false, error: 'That SIP could not be found.' };
  if (!isAction(action)) return { ok: false, error: 'Choose an action.' };
  try {
    const r = await authedRequest<{ expiresIn: number; resendIn: number; sentTo: { mobile: string | null; email: string | null } }>(
      `/sips/${id}/otp`, { method: 'POST', body: { action } },
    );
    return { ok: true, ...r };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message };
    throw error;
  }
}

/** Step 2: the action, with the code the investor read out. */
export async function runSipAction(id: string, action: SipAction, fields: Record<string, string | number | boolean>, otp: string): Promise<ActionResult> {
  if (!Uuid.test(id)) return { ok: false, error: 'That SIP could not be found.', otpProblem: false };
  if (!isAction(action)) return { ok: false, error: 'Choose an action.', otpProblem: false };
  if (!/^\d{4,8}$/.test(String(otp))) return { ok: false, error: 'Enter the code the investor received.', otpProblem: true };
  try {
    const r = await authedRequest<{ label: string; summary: string; sipId: string; orderRef: string | null }>(`/sips/${id}/actions`, {
      method: 'POST',
      // The form's fields first, so none of them can replace the action or the code.
      body: { ...fields, action, otp },
    });
    revalidatePath('/orders/sips', 'layout');
    return { ok: true, ...r };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message, otpProblem: error.code.startsWith('OTP_') };
    throw error;
  }
}

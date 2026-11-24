'use server';

import { revalidatePath } from 'next/cache';

import { ApiError } from '@/lib/api/errors';
import { authedRequest } from '@/lib/auth/session';
import { refreshTransaction } from '@/lib/api/transactions';
import type { MonitoredOrder } from '@/types/admin-api.types';

const Uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type RefreshResult = { order: MonitoredOrder; error: null } | { order: null; error: string };

/**
 * Re-read one order from FP. Session problems redirect (via `authedRequest`)
 * and are rethrown; an FP or API failure comes back as a message.
 */
export async function refreshOrder(orderId: string): Promise<RefreshResult> {
  if (!Uuid.test(orderId)) return { order: null, error: 'That order could not be found.' };
  try {
    const order = await refreshTransaction(orderId);
    revalidatePath('/transactions');
    return { order, error: null };
  } catch (error) {
    if (error instanceof ApiError) return { order: null, error: error.message };
    throw error;
  }
}

export type RetryOtpResult = { ok: true; sentTo: string; resendIn: number } | { ok: false; error: string };
export type RetryResult = { ok: true; orderRef: string | null; orderId: string | null } | { ok: false; error: string; otpProblem: boolean };

/** Retry a failed redemption, step 1: the investor gets an OTP for it. */
export async function sendRetryOtp(orderId: string): Promise<RetryOtpResult> {
  if (!Uuid.test(orderId)) return { ok: false, error: 'That order could not be found.' };
  try {
    const r = await authedRequest<{ resendIn: number; sentTo: { mobile: string | null; email: string | null } }>(`/transactions/${orderId}/otp`, { method: 'POST', body: {} });
    return { ok: true, resendIn: r.resendIn, sentTo: [r.sentTo.mobile, r.sentTo.email].filter(Boolean).join(' and ') || 'the investor' };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message };
    throw error;
  }
}

/** Step 2: place the redemption again with the code the investor read out. */
export async function retryRedemption(orderId: string, otp: string): Promise<RetryResult> {
  if (!Uuid.test(orderId)) return { ok: false, error: 'That order could not be found.', otpProblem: false };
  try {
    const r = await authedRequest<{ orderRef: string | null; orderId: string | null }>(`/transactions/${orderId}/retry`, { method: 'POST', body: { otp } });
    revalidatePath('/transactions', 'layout');
    return { ok: true, ...r };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message, otpProblem: error.code.startsWith('OTP_') };
    throw error;
  }
}

'use server';

import { revalidatePath } from 'next/cache';

import { ApiError } from '@/lib/api/errors';
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

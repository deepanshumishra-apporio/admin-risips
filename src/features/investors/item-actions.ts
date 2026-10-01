'use server';

import { getInvestorItem } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/errors';
import type { InvestorItem, InvestorItemType } from '@/types/admin-api.types';

const Types: readonly InvestorItemType[] = ['holding', 'sip', 'swp', 'stp', 'purchase', 'redemption', 'switch', 'payment'];
const Uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ItemResult = { item: InvestorItem; error: null } | { item: null; error: string };

/**
 * One item for the investor record's side panel, fetched on click. The API
 * checks the item belongs to this investor; these checks only keep junk off
 * the wire. Session problems redirect (via `authedRequest`) and are rethrown.
 */
export async function loadInvestorItem(userId: string, type: InvestorItemType, itemId: string): Promise<ItemResult> {
  if (!Uuid.test(userId) || !Uuid.test(itemId) || !Types.includes(type)) return { item: null, error: 'That item could not be found.' };
  try {
    return { item: await getInvestorItem(userId, type, itemId), error: null };
  } catch (error) {
    if (error instanceof ApiError) return { item: null, error: error.message };
    throw error;
  }
}

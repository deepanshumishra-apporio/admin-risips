import 'server-only';

import { authedRequest } from '@/lib/auth/session';
import type { MonitoredOrder, TransactionList, TransactionListQuery, TransactionSummary } from '@/types/admin-api.types';

export function getTransactionSummary(): Promise<TransactionSummary> {
  return authedRequest('/transactions/summary');
}

export function listTransactions(query: TransactionListQuery): Promise<TransactionList> {
  return authedRequest('/transactions', {
    query: {
      type: query.type,
      state: query.state,
      flag: query.flag,
      attention: query.attention ? 'true' : undefined,
      from: query.from,
      to: query.to,
      search: query.search,
      cursor: query.cursor,
      limit: query.limit,
    },
  });
}

/** Re-read one order from FP. */
export function refreshTransaction(orderId: string): Promise<MonitoredOrder> {
  return authedRequest(`/transactions/${encodeURIComponent(orderId)}/refresh`, { method: 'POST' });
}

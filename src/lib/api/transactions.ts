import 'server-only';

import { authedRequest } from '@/lib/auth/session';
import type { MonitoredOrder, TransactionDetail, TransactionList, TransactionListQuery, TransactionSummary } from '@/types/admin-api.types';

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
      sort: query.sort,
      cursor: query.cursor,
      limit: query.limit,
    },
  });
}

/** Re-read one order from FP. */
export function refreshTransaction(orderId: string): Promise<MonitoredOrder> {
  return authedRequest(`/transactions/${encodeURIComponent(orderId)}/refresh`, { method: 'POST' });
}

/** One transaction in full: facts, timeline and what Retry can do. */
export function getTransactionDetail(orderId: string): Promise<TransactionDetail> {
  return authedRequest(`/transactions/${encodeURIComponent(orderId)}/detail`);
}

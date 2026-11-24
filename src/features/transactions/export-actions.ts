'use server';

import { parseTransactionFilters, toTransactionQuery } from '@/features/transactions/search-params';
import { listTransactions } from '@/lib/api/transactions';

const Ranges = ['current', 'today', 'last7', 'last30', 'thisMonth', 'fy', 'all'] as const;

/** India-local dates for an export range (as the API works them out); null keeps the list's own. */
function rangeDates(range: string): { from?: string; to?: string } | null {
  const ist = (ms: number) => new Date(ms + 5.5 * 3_600_000).toISOString().slice(0, 10);
  const now = Date.now();
  const today = ist(now);
  if (range === 'today') return { from: today, to: today };
  if (range === 'last7') return { from: ist(now - 6 * 86_400_000), to: today };
  if (range === 'last30') return { from: ist(now - 29 * 86_400_000), to: today };
  if (range === 'thisMonth') return { from: `${today.slice(0, 7)}-01`, to: today };
  if (range === 'fy') {
    const [y, m] = today.split('-').map(Number) as [number, number];
    return { from: `${m >= 4 ? y : y - 1}-04-01`, to: today };
  }
  if (range === 'all') return {};
  return null;
}

/** How many transactions an export with this range and the list's other filters would hold. */
export async function countForExport(search: string, range: string): Promise<number | null> {
  const filters = parseTransactionFilters(Object.fromEntries(new URLSearchParams(search)));
  const query = toTransactionQuery({ ...filters, cursor: null }, 1);
  const dates = (Ranges as readonly string[]).includes(range) ? rangeDates(range) : null;
  if (dates) {
    delete query.from;
    delete query.to;
    Object.assign(query, dates);
  }
  try {
    return (await listTransactions(query)).total ?? null;
  } catch {
    return null;
  }
}

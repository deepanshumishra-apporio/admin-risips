import { OrderFlags, OrderStates, OrderTypes } from '@/features/transactions/labels';
import type { MonitorOrderState, OrderFlag, OrderType, TransactionListQuery } from '@/types/admin-api.types';

/** The monitoring filters, as they appear in the URL: shareable and back-button safe. */
export type TransactionFilters = {
  q: string;
  type: OrderType[];
  state: MonitorOrderState[];
  flag: OrderFlag[];
  attention: boolean;
  from: string;
  to: string;
  cursor: string | null;
};

type RawParams = Record<string, string | string[] | undefined>;

const DatePattern = /^\d{4}-\d{2}-\d{2}$/;

const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? value[0] ?? '' : value ?? '');

function listOf<T extends string>(value: string | string[] | undefined, allowed: readonly T[]): T[] {
  return first(value)
    .split(',')
    .map((entry) => entry.trim().toUpperCase())
    .filter((entry): entry is T => (allowed as readonly string[]).includes(entry));
}

/** Unknown values are dropped, never forwarded: the URL is user input. */
export function parseTransactionFilters(params: RawParams): TransactionFilters {
  const cursor = first(params['cursor']);
  const from = first(params['from']);
  const to = first(params['to']);
  return {
    q: first(params['q']).trim().slice(0, 100),
    type: listOf(params['type'], OrderTypes),
    state: listOf(params['state'], OrderStates),
    flag: listOf(params['flag'], OrderFlags),
    attention: first(params['attention']) === 'true',
    from: DatePattern.test(from) ? from : '',
    to: DatePattern.test(to) ? to : '',
    cursor: /^[A-Za-z0-9_-]{1,200}$/.test(cursor) ? cursor : null,
  };
}

export function toTransactionQuery(filters: TransactionFilters, limit: number): TransactionListQuery {
  return {
    limit,
    ...(filters.q && { search: filters.q }),
    ...(filters.type.length && { type: filters.type }),
    ...(filters.state.length && { state: filters.state }),
    ...(filters.flag.length && { flag: filters.flag }),
    ...(filters.attention && { attention: true }),
    ...(filters.from && { from: filters.from }),
    ...(filters.to && filters.to >= filters.from && { to: filters.to }),
    ...(filters.cursor && { cursor: filters.cursor }),
  };
}

export function transactionsHref(filters: Partial<TransactionFilters>): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.type?.length) params.set('type', filters.type.join(','));
  if (filters.state?.length) params.set('state', filters.state.join(','));
  if (filters.flag?.length) params.set('flag', filters.flag.join(','));
  if (filters.attention) params.set('attention', 'true');
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.cursor) params.set('cursor', filters.cursor);
  const text = params.toString();
  return text ? `/transactions?${text}` : '/transactions';
}

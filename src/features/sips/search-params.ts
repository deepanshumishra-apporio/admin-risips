import type { SipQuery } from '@/lib/api/sips';
import type { SipFrequency, SipStatus } from '@/types/admin-api.types';

export const SipStatusOptions: { value: string; label: string; statuses: SipStatus[] }[] = [
  { value: '', label: 'All', statuses: [] },
  { value: 'ACTIVE', label: 'Active', statuses: ['ACTIVE'] },
  { value: 'PAUSED', label: 'Paused', statuses: ['PAUSED'] },
  { value: 'BOUNCED', label: 'Bounced', statuses: ['BOUNCED'] },
];

export const SipFrequencyOptions: { value: '' | SipFrequency; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'quarterly', label: 'Quarterly' },
];

export const SipSortOptions = [
  { value: 'next', label: 'Next instalment' },
  { value: 'amount', label: 'Highest amount' },
  { value: 'start', label: 'Newest first' },
  { value: 'investor', label: 'Investor A–Z' },
] as const;

export const SipPageSize = 10;

export type SipFilters = { q: string; status: string; frequency: string; amc: string; sort: string; page: number };

type RawParams = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? (value[0] ?? '') : (value ?? ''));

export function parseSipFilters(params: RawParams): SipFilters {
  const status = first(params['status']);
  const frequency = first(params['frequency']);
  const sort = first(params['sort']);
  return {
    q: first(params['q']).trim().slice(0, 100),
    status: SipStatusOptions.some((o) => o.value === status) ? status : '',
    frequency: SipFrequencyOptions.some((o) => o.value === frequency) ? frequency : '',
    amc: first(params['amc']).trim().slice(0, 80),
    sort: SipSortOptions.some((o) => o.value === sort) ? sort : 'next',
    page: Math.max(1, Math.min(10_000, Number.parseInt(first(params['page']), 10) || 1)),
  };
}

/** The API query for these filters; without paging, it is also what Export sends. */
export function toSipQuery(filters: SipFilters, paged = true): SipQuery {
  const statuses = SipStatusOptions.find((o) => o.value === filters.status)?.statuses ?? [];
  return {
    ...(filters.q && { search: filters.q }),
    ...(statuses.length && { status: statuses }),
    ...(filters.frequency && { frequency: [filters.frequency] }),
    ...(filters.amc && { amc: filters.amc }),
    sort: filters.sort,
    ...(paged && { limit: SipPageSize, cursor: String((filters.page - 1) * SipPageSize) }),
  };
}

export function sipsHref(filters: Partial<SipFilters>, base = '/orders/sips'): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.status) params.set('status', filters.status);
  if (filters.frequency) params.set('frequency', filters.frequency);
  if (filters.amc) params.set('amc', filters.amc);
  if (filters.sort && filters.sort !== 'next') params.set('sort', filters.sort);
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  const text = params.toString();
  return text ? `${base}?${text}` : base;
}

import type { AumQuery } from '@/lib/api/aum';

export const AumPageSize = 10;

export const AumSorts = [
  { value: 'value_desc', label: 'Current value' },
  { value: 'value_asc', label: 'Lowest value' },
  { value: 'gain_desc', label: 'Best gain' },
  { value: 'gain_asc', label: 'Worst gain' },
  { value: 'investor', label: 'Investor A–Z' },
] as const;

export const AssetClassOptions = [
  { value: '', label: 'All' },
  { value: 'EQUITY', label: 'Equity' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'DEBT', label: 'Debt' },
  { value: 'OTHER', label: 'Other' },
] as const;

export type AumFilters = { q: string; assetClass: string; amc: string; sort: string; page: number };

type RawParams = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? (value[0] ?? '') : (value ?? ''));

export function parseAumFilters(params: RawParams): AumFilters {
  const assetClass = first(params['assetClass']);
  const sort = first(params['sort']);
  return {
    q: first(params['q']).trim().slice(0, 100),
    assetClass: AssetClassOptions.some((o) => o.value === assetClass) ? assetClass : '',
    amc: first(params['amc']).trim().slice(0, 80),
    sort: AumSorts.some((o) => o.value === sort) ? sort : 'value_desc',
    page: Math.max(1, Math.min(10_000, Number.parseInt(first(params['page']), 10) || 1)),
  };
}

/** The API query; without paging it is also what the cards and Export use. */
export function toAumQuery(f: AumFilters, paged = true): AumQuery {
  return {
    ...(f.q && { search: f.q }),
    ...(f.assetClass && { assetClass: f.assetClass }),
    ...(f.amc && { amc: f.amc }),
    sort: f.sort,
    ...(paged && { limit: AumPageSize, cursor: String((f.page - 1) * AumPageSize) }),
  };
}

export function aumHref(f: Partial<AumFilters>, base = '/orders/aum'): string {
  const params = new URLSearchParams();
  if (f.q) params.set('q', f.q);
  if (f.assetClass) params.set('assetClass', f.assetClass);
  if (f.amc) params.set('amc', f.amc);
  if (f.sort && f.sort !== 'value_desc') params.set('sort', f.sort);
  if (f.page && f.page > 1) params.set('page', String(f.page));
  const text = params.toString();
  return text ? `${base}?${text}` : base;
}

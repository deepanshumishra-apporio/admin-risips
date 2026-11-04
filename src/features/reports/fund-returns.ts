import type { FundReturnFilterKey, FundReturnPeriod } from '@/types/admin-api.types';

export const FundReturnFilterKeys: readonly FundReturnFilterKey[] = ['fundHouse', 'assetClass', 'category', 'plan', 'option', 'structure'];

export const FundReturnFilterLabel: Record<FundReturnFilterKey, string> = {
  fundHouse: 'AMC', assetClass: 'Asset class', category: 'Category', plan: 'Plan', option: 'Option', structure: 'Structure',
};

export const FundReturnPeriods: readonly FundReturnPeriod[] = ['1M', '3M', '6M', '1Y', '3Y', '5Y', '10Y'];

type SearchParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] ?? '' : v ?? '');

/** The report's URL state: each multi-select as `A|B`, the grouping and the sort. Only known keys pass through. */
export function fundReturnsParams(sp: SearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of FundReturnFilterKeys) {
    const v = first(sp[k]).slice(0, 4000);
    if (v) out[k] = v;
  }
  if (first(sp['group']) === 'fund') out['group'] = 'fund';
  const sort = first(sp['sort']);
  if ((FundReturnPeriods as readonly string[]).includes(sort)) out['sort'] = sort;
  if (first(sp['dir']) === 'desc') out['dir'] = 'desc';
  return out;
}

export const fundReturnsHref = (params: Record<string, string>, path = '/reports/fund-returns') => {
  const q = new URLSearchParams(params).toString();
  return q ? `${path}?${q}` : path;
};

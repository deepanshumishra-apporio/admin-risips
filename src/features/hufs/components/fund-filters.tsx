'use client';

import { Search, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import type { HufFacet, HufFundList } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

export type FundFilterValues = { search: string; assetClass: string; category: string; fundHouse: string; plan: string; option: string; sip: boolean };

const SelectClass =
  'h-9 min-w-0 rounded-md border border-line-strong bg-surface px-2.5 text-[13px] text-ink focus:border-brand focus:ring-3 focus:ring-brand/12 focus:outline-none';

function FacetSelect({ label, value, facets, onChange }: { label: string; value: string; facets: HufFacet[]; onChange: (v: string) => void }): React.JSX.Element {
  // Keep the chosen value even when the other filters leave it no funds.
  const list = value && !facets.some((f) => f.name === value) ? [{ name: value, count: 0 }, ...facets] : facets;
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={cn(SelectClass, 'max-w-[15rem]', value && 'border-brand bg-brand-soft text-brand-deep')}>
      <option value="">{label}: all</option>
      {list.map((f) => (
        <option key={f.name} value={f.name}>
          {f.name} ({f.count.toLocaleString('en-IN')})
        </option>
      ))}
    </select>
  );
}

/**
 * Search and filters for the fund list. Each change goes into the URL (so a view can be shared and the back button
 * works) and the server reads the list again; a changed filter starts again at page 1.
 */
export function FundFilters({ values, facets, extra = {} }: { values: FundFilterValues; facets: HufFundList['facets']; extra?: Record<string, string> }): React.JSX.Element {
  const router = useRouter();
  const path = usePathname();
  const [pending, start] = useTransition();
  const [search, setSearch] = useState(values.search);

  const go = (change: Partial<FundFilterValues>) => {
    const next = { ...values, ...change };
    // A category belongs to an asset class: changing the class clears it.
    if (change.assetClass !== undefined && change.assetClass !== values.assetClass) next.category = '';
    const params = new URLSearchParams(extra);
    for (const [k, v] of Object.entries(next)) {
      if (k === 'sip') { if (v) params.set('sip', '1'); }
      else if (v) params.set(k, String(v));
    }
    start(() => router.push(`${path}?${params.toString()}`, { scroll: false }));
  };
  const active = values.assetClass || values.category || values.fundHouse || values.plan || values.option || values.sip || values.search;

  return (
    <div className={cn('space-y-3 transition-opacity', pending && 'opacity-60')}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go({ search: search.trim() });
        }}
        className="flex gap-2"
      >
        <span className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={80}
            placeholder="Search by fund, fund house, scheme code or ISIN, e.g. parag parikh flexi"
            className="h-10 w-full rounded-lg border border-line-strong bg-surface pr-3 pl-9 text-[13.5px] text-ink focus:border-brand focus:ring-3 focus:ring-brand/12 focus:outline-none"
          />
        </span>
        <button type="submit" className="h-10 rounded-lg bg-brand px-4 text-[13.5px] font-semibold text-white hover:bg-brand-strong">
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Asset class">
        {[{ name: '', count: 0 }, ...facets.assetClasses].map((f) => {
          const on = values.assetClass === f.name;
          return (
            <button
              key={f.name || 'all'}
              type="button"
              aria-pressed={on}
              onClick={() => go({ assetClass: f.name })}
              className={cn(
                'rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors',
                on ? 'border-brand bg-brand text-white' : 'border-line-strong bg-surface text-ink-soft hover:bg-surface-sunken',
              )}
            >
              {f.name || 'All funds'}
              {f.name ? <span className={cn('ml-1.5 tabular', on ? 'text-white/80' : 'text-ink-muted')}>{f.count.toLocaleString('en-IN')}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FacetSelect label="Category" value={values.category} facets={facets.categories} onChange={(category) => go({ category })} />
        <FacetSelect label="Fund house" value={values.fundHouse} facets={facets.fundHouses} onChange={(fundHouse) => go({ fundHouse })} />
        <FacetSelect label="Plan" value={values.plan} facets={facets.plans} onChange={(plan) => go({ plan })} />
        <FacetSelect label="Option" value={values.option} facets={facets.options} onChange={(option) => go({ option })} />
        <label className={cn('inline-flex h-9 items-center gap-2 rounded-md border px-3 text-[13px]', values.sip ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line-strong text-ink-soft')}>
          <input type="checkbox" checked={values.sip} onChange={(e) => go({ sip: e.target.checked })} className="accent-[var(--color-brand)]" />
          Takes monthly SIPs
        </label>
        {active ? (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              go({ search: '', assetClass: '', category: '', fundHouse: '', plan: '', option: '', sip: false });
            }}
            className="inline-flex h-9 items-center gap-1 px-2 text-[12.5px] font-semibold text-ink-muted hover:text-ink"
          >
            <X className="size-3.5" />
            Clear all
          </button>
        ) : null}
      </div>
    </div>
  );
}

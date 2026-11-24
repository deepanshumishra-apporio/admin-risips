import { Search } from 'lucide-react';

import { SipFrequencyOptions, SipSortOptions, SipStatusOptions, type SipFilters } from '@/features/sips/search-params';
import { cn } from '@/utils/cn';

const Control =
  'h-9 rounded-md border border-line-strong bg-surface px-3 text-[13.5px] text-ink focus:border-brand focus:ring-3 focus:ring-brand/12 focus:outline-none';

function Select({ label, name, value, options }: { label: string; name: string; value: string; options: readonly { value: string; label: string }[] }): React.JSX.Element {
  return (
    <label className="w-full sm:w-auto">
      <span className="mb-1.5 block text-[12.5px] text-ink-soft">{label}</span>
      <select name={name} defaultValue={value} className={cn(Control, 'w-full pr-8 sm:w-auto')}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** A plain GET form, so every view of the list is a link someone can share. */
export function SipFiltersBar({ filters, amcs }: { filters: SipFilters; amcs: string[] }): React.JSX.Element {
  return (
    <form method="get" action="/orders/sips" className="flex flex-wrap items-end gap-2 border-b border-line px-4 py-3">
      <label className="min-w-[220px] flex-1">
        <span className="mb-1.5 block text-[12.5px] text-ink-soft">Search</span>
        <span className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
          <input name="q" defaultValue={filters.q} maxLength={100} placeholder="Investor, PAN, folio, scheme" className={cn(Control, 'w-full pl-9')} />
        </span>
      </label>
      <Select label="Frequency" name="frequency" value={filters.frequency} options={SipFrequencyOptions} />
      <Select label="Status" name="status" value={filters.status} options={SipStatusOptions} />
      <Select label="AMC" name="amc" value={filters.amc} options={[{ value: '', label: 'All AMCs' }, ...amcs.map((a) => ({ value: a, label: a }))]} />
      <Select label="Sort by" name="sort" value={filters.sort} options={SipSortOptions} />
      <button type="submit" className="h-9 rounded-md bg-brand px-4 text-[13.5px] font-medium text-white hover:bg-brand-strong">
        Apply
      </button>
    </form>
  );
}

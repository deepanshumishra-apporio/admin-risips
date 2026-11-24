import { Search } from 'lucide-react';

import { OrderStateLabel, OrderStates, OrderTypeLabel, OrderTypes } from '@/features/transactions/labels';
import { TransactionSorts, type TransactionFilters } from '@/features/transactions/search-params';
import { cn } from '@/utils/cn';

const Control =
  'h-9 rounded-md border border-line-strong bg-surface px-3 text-[13.5px] text-ink focus:border-brand focus:ring-3 focus:ring-brand/12 focus:outline-none';

function Select({ label, name, value, options }: { label: string; name: string; value: string; options: { value: string; label: string }[] }): React.JSX.Element {
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

/**
 * Search, transaction type, status and sort, as in the design. A plain GET form, so every view is a link. Filters
 * that only arrive by link (a flag or a date range from the dashboard) are kept as hidden fields.
 */
export function TransactionFiltersBar({ filters }: { filters: TransactionFilters }): React.JSX.Element {
  const single = (values: readonly string[]): string => (values.length === 1 ? values[0]! : '');
  return (
    <form method="get" action="/transactions" className="flex flex-wrap items-end gap-2 border-b border-line px-4 py-3">
      <label className="min-w-[220px] flex-1">
        <span className="mb-1.5 block text-[12.5px] text-ink-soft">Search</span>
        <span className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
          <input
            name="q"
            defaultValue={filters.q}
            maxLength={100}
            placeholder="Transaction ID, investor, PAN, folio, scheme"
            className={cn(Control, 'w-full pl-9')}
          />
        </span>
      </label>
      <Select
        label="Transaction type"
        name="type"
        value={single(filters.type)}
        options={[{ value: '', label: 'All' }, ...OrderTypes.map((t) => ({ value: t, label: OrderTypeLabel[t] }))]}
      />
      <Select
        label="Status"
        name="state"
        value={single(filters.state)}
        options={[{ value: '', label: 'All' }, ...OrderStates.map((s) => ({ value: s, label: OrderStateLabel[s] }))]}
      />
      <Select label="Sort by" name="sort" value={filters.sort} options={TransactionSorts.map((o) => ({ value: o.value, label: o.label }))} />
      {filters.flag.length ? <input type="hidden" name="flag" value={filters.flag.join(',')} /> : null}
      {filters.attention ? <input type="hidden" name="attention" value="true" /> : null}
      {filters.from ? <input type="hidden" name="from" value={filters.from} /> : null}
      {filters.to ? <input type="hidden" name="to" value={filters.to} /> : null}
      <button type="submit" className="h-9 rounded-md bg-brand px-4 text-[13.5px] font-medium text-white hover:bg-brand-strong">
        Apply
      </button>
    </form>
  );
}

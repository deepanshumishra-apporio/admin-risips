import { Search } from 'lucide-react';
import Link from 'next/link';

import { OrderStateLabel, OrderStates, OrderTypeLabel, OrderTypes } from '@/features/transactions/labels';
import { transactionsHref, type TransactionFilters } from '@/features/transactions/search-params';
import { cn } from '@/utils/cn';

const Blank: TransactionFilters = { q: '', type: [], state: [], flag: [], attention: false, from: '', to: '', cursor: null };

const Quick: { label: string; filters: Partial<TransactionFilters> }[] = [
  { label: 'All orders', filters: {} },
  { label: 'Needs attention', filters: { attention: true } },
  { label: 'In flight', filters: { state: ['UNDER_REVIEW', 'PENDING', 'CONFIRMED', 'SUBMITTED'] } },
  { label: 'Failed', filters: { state: ['FAILED', 'REVERSED'] } },
  { label: 'SIP instalments', filters: { type: ['SIP_INSTALLMENT'] } },
  { label: 'Redemptions', filters: { type: ['REDEMPTION', 'SWP_INSTALLMENT'] } },
];

const same = (a: readonly string[], b: readonly string[] = []): boolean => a.length === b.length && a.every((v) => b.includes(v));

const ControlClass =
  'h-9 rounded-md border border-line-strong bg-surface px-3 text-[13.5px] text-ink focus:border-brand focus:ring-3 focus:ring-brand/12 focus:outline-none';

/** A plain GET form, like the investor list: every view of the queue is a URL someone can share. */
export function TransactionFiltersBar({ filters }: { filters: TransactionFilters }): React.JSX.Element {
  const single = (values: readonly string[]): string => (values.length === 1 ? values[0]! : '');

  return (
    <div className="mb-4 space-y-3">
      <nav aria-label="Quick filters" className="flex flex-wrap gap-1.5">
        {Quick.map((quick) => {
          const target = { ...Blank, q: filters.q, from: filters.from, to: filters.to, ...quick.filters };
          const active =
            same(filters.type, target.type) &&
            same(filters.state, target.state) &&
            same(filters.flag, target.flag) &&
            filters.attention === target.attention;
          return (
            <Link
              key={quick.label}
              href={transactionsHref(target)}
              className={cn(
                'rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors',
                active ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line-strong text-ink-soft hover:bg-surface-sunken',
              )}
            >
              {quick.label}
            </Link>
          );
        })}
      </nav>

      <form method="get" action="/transactions" className="flex flex-wrap items-end gap-2">
        <label className="min-w-[220px] flex-1">
          <span className="mb-1.5 block text-[12.5px] text-ink-soft">Investor, scheme, folio or PAN (last 4)</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
            <input name="q" defaultValue={filters.q} maxLength={100} placeholder="e.g. Asha, Bluechip, 234F" className={cn(ControlClass, 'w-full pl-9')} />
          </span>
        </label>

        <label>
          <span className="mb-1.5 block text-[12.5px] text-ink-soft">Type</span>
          <select name="type" defaultValue={single(filters.type)} className={ControlClass}>
            <option value="">Any type</option>
            {OrderTypes.map((type) => (
              <option key={type} value={type}>
                {OrderTypeLabel[type]}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1.5 block text-[12.5px] text-ink-soft">State</span>
          <select name="state" defaultValue={single(filters.state)} className={ControlClass}>
            <option value="">Any state</option>
            {OrderStates.map((state) => (
              <option key={state} value={state}>
                {OrderStateLabel[state]}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1.5 block text-[12.5px] text-ink-soft">Placed from</span>
          <input type="date" name="from" defaultValue={filters.from} className={cn(ControlClass, 'tabular')} />
        </label>
        <label>
          <span className="mb-1.5 block text-[12.5px] text-ink-soft">to</span>
          <input type="date" name="to" defaultValue={filters.to} className={cn(ControlClass, 'tabular')} />
        </label>

        {filters.attention ? <input type="hidden" name="attention" value="true" /> : null}
        {filters.flag.length ? <input type="hidden" name="flag" value={filters.flag.join(',')} /> : null}

        <button type="submit" className="h-9 rounded-md bg-brand px-4 text-[13.5px] font-medium text-white transition-colors hover:bg-brand-strong">
          Apply
        </button>
        <Link href="/transactions" className="h-9 rounded-md px-3 text-[13.5px] leading-9 font-medium text-ink-muted hover:text-ink">
          Clear
        </Link>
      </form>
    </div>
  );
}

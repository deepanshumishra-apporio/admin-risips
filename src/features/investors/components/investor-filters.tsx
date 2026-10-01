import { Search } from 'lucide-react';
import Link from 'next/link';

import { KycOptions, StageOptions } from '@/features/investors/labels';
import { investorsHref, type InvestorFilters } from '@/features/investors/search-params';
import { cn } from '@/utils/cn';

const Blank: InvestorFilters = { q: '', stage: [], kyc: [], stalled: false, sipDue: null, cursor: null };

const Quick: { label: string; filters: Partial<InvestorFilters> }[] = [
  { label: 'All', filters: {} },
  { label: 'KYC pending', filters: { kyc: ['NOT_STARTED', 'PAN_CHECK_FAILED', 'IN_PROGRESS', 'FAILED', 'EXPIRED'] } },
  { label: 'KYC stalled', filters: { stalled: true } },
  { label: 'Ready to invest', filters: { stage: ['READY_TO_INVEST'] } },
  { label: 'Invested', filters: { stage: ['INVESTED'] } },
  { label: 'SIP due in 7 days', filters: { sipDue: 7 } },
];

const sameList = (a: readonly string[], b: readonly string[] = []): boolean =>
  a.length === b.length && a.every((value) => b.includes(value));

const ControlClass =
  'h-9 rounded-md border border-line-strong bg-surface px-3 text-[13.5px] text-ink focus:border-brand focus:ring-3 focus:ring-brand/12 focus:outline-none';

/**
 * A plain GET form: filtering works without any client JavaScript and every
 * result is a URL someone can bookmark or paste to a colleague.
 */
export function InvestorFiltersBar({ filters }: { filters: InvestorFilters }): React.JSX.Element {
  const single = (values: readonly string[]): string => (values.length === 1 ? values[0]! : '');

  return (
    <div className="mb-4 space-y-3">
      <nav aria-label="Quick filters" className="flex flex-wrap gap-1.5">
        {Quick.map((quick) => {
          const target = { ...Blank, q: filters.q, ...quick.filters };
          const active =
            sameList(filters.stage, target.stage) &&
            sameList(filters.kyc, target.kyc) &&
            filters.stalled === target.stalled &&
            filters.sipDue === target.sipDue;
          return (
            <Link
              key={quick.label}
              href={investorsHref(target)}
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

      <form method="get" action="/investors" className="flex flex-wrap items-end gap-2">
        <label className="min-w-[240px] flex-1">
          <span className="mb-1.5 block text-[12.5px] text-ink-soft">Name, email, phone or PAN</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
            <input
              name="q"
              defaultValue={filters.q}
              maxLength={100}
              placeholder="e.g. Asha, 98765, 234F"
              className={cn(ControlClass, 'w-full pl-9')}
            />
          </span>
        </label>

        <label>
          <span className="mb-1.5 block text-[12.5px] text-ink-soft">Stage</span>
          <select name="stage" defaultValue={single(filters.stage)} className={ControlClass}>
            <option value="">Any stage</option>
            {StageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1.5 block text-[12.5px] text-ink-soft">KYC</span>
          <select name="kyc" defaultValue={single(filters.kyc)} className={ControlClass}>
            <option value="">Any KYC status</option>
            {KycOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {filters.stalled ? <input type="hidden" name="stalled" value="true" /> : null}
        {filters.sipDue !== null ? <input type="hidden" name="sipDue" value={filters.sipDue} /> : null}

        <button
          type="submit"
          className="h-9 rounded-md bg-brand px-4 text-[13.5px] font-medium text-white transition-colors hover:bg-brand-deep"
        >
          Apply
        </button>
        <Link href="/investors" className="h-9 rounded-md px-3 text-[13.5px] leading-9 font-medium text-ink-muted hover:text-ink">
          Clear
        </Link>
      </form>
    </div>
  );
}

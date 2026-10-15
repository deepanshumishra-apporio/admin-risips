import { Search, SlidersHorizontal, X } from 'lucide-react';
import Link from 'next/link';

import { KycOptions, StageOptions } from '@/features/investors/labels';
import { BlankFilters, investorsHref, sameView, type InvestorFilters } from '@/features/investors/search-params';
import type { InvestorOverview } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatCount } from '@/utils/format';

const KycPending = ['NOT_STARTED', 'PAN_CHECK_FAILED', 'IN_PROGRESS', 'FAILED', 'EXPIRED'] as const;

const ControlClass =
  'h-9 w-full rounded-md border border-line-strong bg-surface px-3 text-[13.5px] text-ink focus:border-brand focus:ring-3 focus:ring-brand/12 focus:outline-none';

/**
 * Quick filters with their counts, the search box, and the stage and KYC
 * pickers. Plain links and a GET form: filtering works without client
 * JavaScript and every view is a URL someone can paste to a colleague.
 */
export function InvestorFiltersBar({ filters, overview }: { filters: InvestorFilters; overview: InvestorOverview | null }): React.JSX.Element {
  // Without the overview the chips still filter; they just carry no count.
  const quick: { label: string; count: number | undefined; filters: Partial<InvestorFilters> }[] = [
    { label: 'All', count: overview?.total, filters: {} },
    { label: 'KYC pending', count: overview?.kycPending, filters: { kyc: [...KycPending] } },
    { label: 'KYC stalled', count: overview?.kycStalled, filters: { stalled: true } },
    { label: 'Ready to invest', count: overview?.byStage.READY_TO_INVEST, filters: { stage: ['READY_TO_INVEST'] } },
    { label: 'Invested', count: overview?.byStage.INVESTED, filters: { stage: ['INVESTED'] } },
    { label: 'SIP due in 7 days', count: overview?.sipDueIn7Days, filters: { sipDue: 7 } },
  ];
  const single = (values: readonly string[]): string => (values.length === 1 ? values[0]! : '');
  const pickerCount = (filters.stage.length ? 1 : 0) + (filters.kyc.length ? 1 : 0);

  return (
    <div className="space-y-4 px-6 pt-6">
      <nav aria-label="Quick filters" className="flex flex-wrap gap-2">
        {quick.map((item) => {
          const target = { ...BlankFilters, q: filters.q, ...item.filters };
          const active = sameView(filters, target);
          return (
            <Link
              key={item.label}
              href={investorsHref(target)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                active ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line-strong text-ink-soft hover:bg-surface-sunken hover:text-ink',
              )}
            >
              {item.label}
              {item.count !== undefined ? (
                <span className={cn('tabular font-semibold', active ? 'text-brand-deep' : 'text-ink')}>{formatCount(item.count)}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <form method="get" action="/investors" className="flex flex-wrap items-stretch gap-3">
        {/* The view's other filters ride along, so a search narrows the view rather than resetting it. */}
        {filters.stalled ? <input type="hidden" name="stalled" value="true" /> : null}
        {filters.sipDue !== null ? <input type="hidden" name="sipDue" value={filters.sipDue} /> : null}
        {filters.attention ? <input type="hidden" name="attention" value={filters.attention} /> : null}
        {filters.stage.length > 1 ? <input type="hidden" name="stage" value={filters.stage.join(',')} /> : null}
        {filters.kyc.length > 1 ? <input type="hidden" name="kyc" value={filters.kyc.join(',')} /> : null}

        <label className="relative min-w-[260px] flex-1">
          <span className="sr-only">Search investors</span>
          <input
            name="q"
            defaultValue={filters.q}
            maxLength={100}
            placeholder="Name, email, phone or PAN"
            className="h-11 w-full rounded-lg border border-line bg-surface-sunken pr-11 pl-4 text-[14px] text-ink placeholder:text-ink-muted focus:border-brand focus:ring-3 focus:ring-brand/12 focus:outline-none"
          />
          <button type="submit" aria-label="Search" className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-ink-muted hover:text-ink">
            <Search className="size-4" />
          </button>
        </label>

        {/* A menu without JavaScript: <details> opens it, Apply submits the form it sits in. */}
        <details className="group relative">
          <summary className="flex h-11 cursor-pointer list-none items-center gap-2 rounded-lg border border-line bg-surface-sunken px-4 text-[14px] font-medium text-ink select-none hover:border-line-strong [&::-webkit-details-marker]:hidden">
            <SlidersHorizontal className="size-4 text-ink-muted" />
            Stage · KYC
            {pickerCount ? (
              <span className="tabular rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white">{pickerCount}</span>
            ) : null}
          </summary>
          <div className="absolute right-0 z-30 mt-2 w-72 space-y-3 rounded-lg border border-line bg-surface p-4 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.35)]">
            <label className="block">
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
            <label className="block">
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
            <div className="flex items-center justify-between pt-1">
              <Link href={investorsHref({ ...BlankFilters, q: filters.q })} className="text-[13px] font-medium text-ink-muted hover:text-ink">
                Clear filters
              </Link>
              <button type="submit" className="h-9 rounded-md bg-brand px-4 text-[13.5px] font-medium text-white transition-colors hover:bg-brand-strong">
                Apply
              </button>
            </div>
          </div>
        </details>

        {filters.q ? (
          <Link
            href={investorsHref(filters, { q: '' })}
            className="inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-ink-muted hover:text-ink"
          >
            <X className="size-4" />
            Clear search
          </Link>
        ) : null}
      </form>
    </div>
  );
}

import Link from 'next/link';

import { quickRanges, reportHref } from '@/features/reports/search-params';
import type { ReportDefinition, ReportFilters } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

const ControlClass =
  'h-9 rounded-md border border-line-strong bg-surface px-3 text-[13.5px] text-ink focus:border-brand focus:ring-3 focus:ring-brand/12 focus:outline-none';

/**
 * A plain GET form, like the investor filters: every run of a report is a URL
 * that can be bookmarked or sent to a colleague, and the export link below it
 * carries the same filters.
 */
export function ReportFiltersBar({ report, filters }: { report: ReportDefinition; filters: ReportFilters }): React.JSX.Element | null {
  if (!report.dateField && !report.statusLabel) return null;

  return (
    <div className="mb-4 space-y-3">
      {report.dateField ? (
        <nav aria-label="Quick date ranges" className="flex flex-wrap gap-1.5">
          {quickRanges().map((range) => {
            const active = (filters.from ?? '') === (range.from ?? '') && (filters.to ?? '') === (range.to ?? '');
            return (
              <Link
                key={range.label}
                href={reportHref(report.key, {
                  ...(range.from && { from: range.from }),
                  ...(range.to && { to: range.to }),
                  ...(filters.status && { status: filters.status }),
                })}
                className={cn(
                  'rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors',
                  active ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line-strong text-ink-soft hover:bg-surface-sunken',
                )}
              >
                {range.label}
              </Link>
            );
          })}
        </nav>
      ) : null}

      <form method="get" action={`/reports/${report.key}`} className="flex flex-wrap items-end gap-2">
        {report.dateField ? (
          <>
            <label>
              <span className="mb-1.5 block text-[12.5px] text-ink-soft">{report.dateField} from</span>
              <input type="date" name="from" defaultValue={filters.from ?? ''} className={cn(ControlClass, 'tabular')} />
            </label>
            <label>
              <span className="mb-1.5 block text-[12.5px] text-ink-soft">to</span>
              <input type="date" name="to" defaultValue={filters.to ?? ''} className={cn(ControlClass, 'tabular')} />
            </label>
          </>
        ) : null}

        {report.statusLabel ? (
          <label>
            <span className="mb-1.5 block text-[12.5px] text-ink-soft">{report.statusLabel}</span>
            <select name="status" defaultValue={filters.status ?? ''} className={ControlClass}>
              <option value="">Any</option>
              {report.statuses.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <button
          type="submit"
          className="h-9 rounded-md bg-brand px-4 text-[13.5px] font-medium text-white transition-colors hover:bg-brand-strong"
        >
          Apply
        </button>
        <Link
          href={reportHref(report.key)}
          className="h-9 rounded-md px-3 text-[13.5px] leading-9 font-medium text-ink-muted hover:text-ink"
        >
          Clear
        </Link>
      </form>
    </div>
  );
}

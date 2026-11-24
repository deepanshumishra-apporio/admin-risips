import { Search } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { AssetClassColor } from '@/features/dashboard/components/asset-breakup';
import { MetricSection } from '@/features/dashboard/components/metric-section';
import { AssetClassOptions, aumHref, AumSorts, parseAumFilters, toAumQuery } from '@/features/aum/search-params';
import { getAumSummary, listAum } from '@/lib/api/aum';
import { hasPermission } from '@/lib/auth/session';
import type { AssetClassKey } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatCount, formatDateTime, formatInrString } from '@/utils/format';

export const metadata: Metadata = { title: 'Total AUM · RiSips Admin' };

const ClassLabel: Record<AssetClassKey, string> = { EQUITY: 'Equity', HYBRID: 'Hybrid', DEBT: 'Debt', OTHER: 'Other' };
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

const money = (v: string | null) => (v === null ? '—' : `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function TotalAumPage({ searchParams }: Props): Promise<React.JSX.Element> {
  if (!(await hasPermission('dashboard.read'))) {
    return (
      <>
        <PageHeader title="Total AUM" />
        <NoAccess what="AUM" />
      </>
    );
  }
  const filters = parseAumFilters(await searchParams);
  const [summary, list] = await Promise.all([getAumSummary(toAumQuery(filters, false)), listAum(toAumQuery(filters))]);
  const first = list.total === 0 ? 0 : list.offset + 1;
  const last = list.offset + list.items.length;
  const pager = 'inline-flex h-9 items-center rounded-md border px-4 text-[13.5px] font-medium';
  const head = 'px-3 py-2.5 font-medium whitespace-nowrap';
  const cell = 'px-3 py-2.5 whitespace-nowrap';

  return (
    <>
      <PageHeader
        title="Total AUM"
        description={`Assets under management across all investors, by folio and scheme${summary.valuedAt ? ` · valued ${formatDateTime(summary.valuedAt)}` : ''}`}
        actions={
          <a
            href={aumHref({ ...filters, page: 1 }, '/orders/aum/export')}
            className="inline-flex h-9.5 items-center rounded-md border border-line-strong bg-surface px-4 text-[13.5px] font-semibold text-ink hover:bg-surface-sunken"
          >
            Export
          </a>
        }
      />

      <div className="space-y-5">
        <MetricSection
          columns={4}
          metrics={[
            { label: 'Total AUM', value: formatInrString(summary.aum), caption: `${formatInrString(summary.invested)} invested`, hint: 'Current value at the last NAV, for the filters shown.' },
            { label: 'Investors with AUM', value: formatCount(summary.investors) },
            { label: 'Folios', value: formatCount(summary.folios) },
            { label: 'Schemes', value: formatCount(summary.schemes) },
          ]}
        />

        <Card>
          <form method="get" action="/orders/aum" className="flex flex-wrap items-end gap-2 border-b border-line px-4 py-3">
            <label className="min-w-[220px] flex-1">
              <span className="mb-1.5 block text-[12.5px] text-ink-soft">Search</span>
              <span className="relative block">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
                <input name="q" defaultValue={filters.q} maxLength={100} placeholder="Investor, PAN, folio, scheme" className={cn(Control, 'w-full pl-9')} />
              </span>
            </label>
            <Select label="Asset class" name="assetClass" value={filters.assetClass} options={AssetClassOptions} />
            <Select label="AMC" name="amc" value={filters.amc} options={[{ value: '', label: 'All AMCs' }, ...summary.amcs.map((a) => ({ value: a, label: a }))]} />
            <Select label="Sort by" name="sort" value={filters.sort} options={AumSorts} />
            <button type="submit" className="h-9 rounded-md bg-brand px-4 text-[13.5px] font-medium text-white hover:bg-brand-strong">
              Apply
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-[13px]">
              <thead>
                <tr className="border-b border-line bg-surface-sunken text-left text-[12px] text-ink-muted">
                  <th className={head}>Investor</th>
                  <th className={head}>Folio</th>
                  <th className={head}>Scheme</th>
                  <th className={head}>Asset class</th>
                  <th className={`${head} text-right`}>Units</th>
                  <th className={`${head} text-right`}>Invested</th>
                  <th className={`${head} text-right`}>Current value</th>
                  <th className={`${head} text-right`}>Gain / Loss</th>
                </tr>
              </thead>
              <tbody>
                {list.items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-ink-muted">
                      {summary.valuedAt ? 'No holdings match these filters.' : 'Holdings are being valued for the first time. Refresh in a few minutes.'}
                    </td>
                  </tr>
                ) : (
                  list.items.map((h) => (
                    <tr key={`${h.investor.id}:${h.folio}:${h.isin}`} className="border-b border-line last:border-b-0 hover:bg-surface-sunken/60">
                      <td className={cell}>
                        <Link href={`/investors/${h.investor.id}`} className="font-medium text-brand underline-offset-2 hover:underline">
                          {h.investor.name || 'No name yet'}
                        </Link>
                      </td>
                      <td className={`${cell} tabular text-ink-soft`}>{h.folio || '—'}</td>
                      <td className="max-w-[260px] px-3 py-2.5">
                        <span className="block truncate text-ink" title={h.scheme}>
                          {h.scheme}
                        </span>
                        {h.amc ? <span className="block text-[11.5px] text-ink-muted">{h.amc}</span> : null}
                      </td>
                      <td className={cell}>
                        <span className="flex items-center gap-2 text-ink">
                          <span className="size-2.5 rounded-full" style={{ backgroundColor: AssetClassColor[h.assetClass] }} />
                          {ClassLabel[h.assetClass]}
                        </span>
                      </td>
                      <td className={`${cell} tabular text-right text-ink-soft`}>{Number(h.units).toLocaleString('en-IN', { maximumFractionDigits: 3 })}</td>
                      <td className={`${cell} tabular text-right text-ink-soft`}>{money(h.invested)}</td>
                      <td className={`${cell} tabular text-right font-medium text-ink`}>{money(h.current)}</td>
                      <td
                        className={cn(
                          `${cell} tabular text-right font-medium`,
                          h.gainPercent === null ? 'text-ink-muted' : h.gainPercent >= 0 ? 'text-success' : 'text-danger',
                        )}
                      >
                        {h.gainPercent === null ? '—' : `${h.gainPercent > 0 ? '+' : ''}${h.gainPercent.toFixed(2)}%`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
            <p className="text-[12.5px] text-ink-muted">
              Showing {formatCount(first)}–{formatCount(last)} of {formatCount(list.total)}
            </p>
            <div className="flex gap-2">
              {filters.page > 1 ? (
                <Link href={aumHref({ ...filters, page: filters.page - 1 })} className={cn(pager, 'border-line-strong text-ink hover:bg-surface-sunken')}>
                  Previous
                </Link>
              ) : (
                <span className={cn(pager, 'cursor-not-allowed border-line text-ink-muted')}>Previous</span>
              )}
              {list.nextCursor ? (
                <Link href={aumHref({ ...filters, page: filters.page + 1 })} className={cn(pager, 'border-brand bg-brand text-white hover:bg-brand-strong')}>
                  Next
                </Link>
              ) : (
                <span className={cn(pager, 'cursor-not-allowed border-line text-ink-muted')}>Next</span>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

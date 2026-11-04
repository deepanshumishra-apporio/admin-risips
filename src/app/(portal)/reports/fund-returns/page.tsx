import { ArrowDown, ArrowLeft, ArrowUp, ArrowUpDown, FileSpreadsheet, FileText, TriangleAlert } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { FundReturnsFilters } from '@/features/reports/components/fund-returns-filters';
import { fundReturnsHref, fundReturnsParams } from '@/features/reports/fund-returns';
import { ApiError } from '@/lib/api/errors';
import { getFundReturns } from '@/lib/api/reports';
import { hasPermission } from '@/lib/auth/session';
import type { FundReturnPeriod, FundReturnsReport } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

export const metadata: Metadata = { title: 'Fund returns by AMC · RiSips Admin' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const pct = (n: number | null) => (n === null ? '—' : `${n > 0 ? '+' : ''}${n.toFixed(2)}%`);
const tone = (n: number | null) => (n === null ? 'text-ink-muted' : n < 0 ? 'text-danger' : 'text-success');
const longDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** A column header that sorts by its period: high to low first, then low to high. */
function SortHeader({ params, period, label }: { params: Record<string, string>; period: FundReturnPeriod | 'name'; label: string }): React.JSX.Element {
  const active = (params['sort'] ?? 'name') === period;
  const desc = params['dir'] === 'desc';
  const nextDir = period === 'name' ? (active && !desc ? 'desc' : 'asc') : active && desc ? 'asc' : 'desc';
  const next = { ...params, sort: period, dir: nextDir };
  if (period === 'name') delete (next as Record<string, string>)['sort'];
  if (nextDir === 'asc') delete (next as Record<string, string>)['dir'];
  const Icon = !active ? ArrowUpDown : desc ? ArrowDown : ArrowUp;
  return (
    <Link href={fundReturnsHref(next)} scroll={false} className={cn('inline-flex items-center gap-1 hover:text-ink', active && 'text-ink')}>
      {label}
      <Icon className={cn('size-3', !active && 'opacity-40')} />
    </Link>
  );
}

const Th = ({ children, right = false, className }: { children: React.ReactNode; right?: boolean; className?: string }) => (
  <th className={cn('px-3 py-2.5 text-[11.5px] font-semibold tracking-[0.04em] whitespace-nowrap text-ink-muted uppercase', right ? 'text-right' : 'text-left', className)}>{children}</th>
);

/**
 * Every mutual fund's 1 month to 10 year return from AMFI's NAVs, by AMC (the average of its funds) or fund by fund,
 * with multi-select filters. Downloads as Excel or PDF exactly as filtered and sorted.
 */
export default async function FundReturnsPage({ searchParams }: Props): Promise<React.JSX.Element> {
  const back = (
    <Link href="/reports" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
      <ArrowLeft className="size-3.5" />
      Reports
    </Link>
  );
  if (!(await hasPermission('reports.read'))) {
    return (
      <>
        {back}
        <PageHeader title="Fund returns by AMC" />
        <NoAccess what="reports" />
      </>
    );
  }
  const sp = await searchParams;
  const params = fundReturnsParams(sp);
  let report: FundReturnsReport | null = null;
  let error: string | null = null;
  try {
    report = await getFundReturns(params);
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    error = e.message;
  }
  const failed = sp['failed'] !== undefined;
  const download = (format: 'xlsx' | 'pdf') => fundReturnsHref({ ...params, format }, '/reports/fund-returns/export');
  const byFund = params['group'] === 'fund';

  return (
    <>
      {back}
      <PageHeader
        title="Fund returns by AMC"
        description="Returns over 1 month to 10 years for every mutual fund, from AMFI's daily NAVs. Filter with the dropdowns, sort by any column, then download what you see."
        actions={
          report && report.totalFunds > 0 ? (
            <>
              {/* Plain links: the browser downloads the file itself, through this server. */}
              <a href={download('xlsx')} className="inline-flex h-9 items-center gap-2 rounded-md bg-brand px-3.5 text-[13.5px] font-medium text-white hover:bg-brand-strong">
                <FileSpreadsheet className="size-4" />
                Excel
              </a>
              <a href={download('pdf')} className="inline-flex h-9 items-center gap-2 rounded-md border border-line-strong bg-surface px-3.5 text-[13.5px] font-medium text-ink hover:bg-surface-sunken">
                <FileText className="size-4" />
                PDF
              </a>
            </>
          ) : undefined
        }
      />

      {failed ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-[13px] text-danger">
          <TriangleAlert className="size-4 shrink-0" />
          The download could not be made. Try again in a minute.
        </div>
      ) : null}

      {error || !report ? (
        <p className="rounded-md border border-danger/25 bg-danger-soft px-4 py-2.5 text-[13px] text-danger">{error ?? 'The report could not be read.'}</p>
      ) : (
        <>
          <FundReturnsFilters params={params} facets={report.facets} />
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5 text-[12.5px] text-ink-muted">
              <p>
                <span className="tabular font-semibold text-ink">{report.totalFunds.toLocaleString('en-IN')}</span> funds across{' '}
                <span className="tabular font-semibold text-ink">{report.totalAmcs.toLocaleString('en-IN')}</span> AMCs · NAVs as of {longDate(report.asOf)}
                {report.truncated ? ' · showing the first 500 funds; the downloads have all' : ''}
              </p>
            </div>
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse">
                <thead>
                  <tr className="border-b border-line bg-surface-sunken">
                    <Th className="w-14">S No</Th>
                    <Th><SortHeader params={params} period="name" label={byFund ? 'Fund' : 'AMC'} /></Th>
                    {byFund ? <Th>Category</Th> : <Th right>Funds</Th>}
                    {report.periods.map((p) => (
                      <Th key={p.key} right>
                        <SortHeader params={params} period={p.key} label={p.label} />
                      </Th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-[13px]">
                  {report.amcs?.map((r, i) => (
                    <tr key={r.fundHouse} className="hover:bg-surface-sunken">
                      <td className="tabular px-3 py-2 text-ink-muted">{i + 1}</td>
                      <td className="px-3 py-2 font-medium text-ink">{r.fundHouse}</td>
                      <td className="tabular px-3 py-2 text-right text-ink-soft">{r.funds}</td>
                      {report.periods.map((p) => (
                        <td key={p.key} className={cn('tabular px-3 py-2 text-right font-medium', tone(r.returns[p.key]))} title={`${r.counts[p.key]} of ${r.funds} funds are old enough for ${p.label.toLowerCase()}`}>
                          {pct(r.returns[p.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {report.funds?.map((f, i) => (
                    <tr key={f.amfiCode} className="hover:bg-surface-sunken">
                      <td className="tabular px-3 py-2 text-ink-muted">{i + 1}</td>
                      <td className="max-w-[22rem] px-3 py-2">
                        <span className="block truncate font-medium text-ink" title={f.name}>{f.name}</span>
                        <span className="block truncate text-[11.5px] text-ink-muted">{f.fundHouse} · {f.plan} · {f.option}</span>
                      </td>
                      <td className="max-w-[12rem] truncate px-3 py-2 text-ink-soft">{f.category}</td>
                      {report.periods.map((p) => (
                        <td key={p.key} className={cn('tabular px-3 py-2 text-right font-medium', tone(f.returns[p.key]))}>{pct(f.returns[p.key])}</td>
                      ))}
                    </tr>
                  ))}
                  {report.totalFunds === 0 ? (
                    <tr>
                      <td colSpan={3 + report.periods.length} className="px-4 py-10 text-center text-ink-muted">No funds match these filters.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="mt-2 text-[12px] text-ink-muted">{report.basis} A dash means no fund is old enough for that period.</p>
        </>
      )}
    </>
  );
}

import { Search } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { MetricSection } from '@/features/dashboard/components/metric-section';
import { AlertTable } from '@/features/compliance/components/alert-table';
import { complianceHref, ComplianceViews, KindLabel, parseComplianceFilters, toComplianceQuery, ViewLabel } from '@/features/compliance/labels';
import { listComplianceAlerts } from '@/lib/api/compliance';
import { hasPermission } from '@/lib/auth/session';
import { cn } from '@/utils/cn';
import { formatCount, timeAgo } from '@/utils/format';

export const metadata: Metadata = { title: 'Compliance · RiSips Admin' };

const PageSize = 10;

const Control =
  'h-9 rounded-md border border-line-strong bg-surface px-3 text-[13.5px] text-ink focus:border-brand focus:ring-3 focus:ring-brand/12 focus:outline-none';

type CompliancePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CompliancePage({ searchParams }: CompliancePageProps): Promise<React.JSX.Element> {
  const [canManage, canExport] = await Promise.all([hasPermission('compliance.manage'), hasPermission('reports.read')]);
  if (!canManage) {
    return (
      <>
        <PageHeader title="Compliance" />
        <NoAccess what="the compliance queue" />
      </>
    );
  }

  const filters = parseComplianceFilters(await searchParams);
  const result = await listComplianceAlerts(toComplianceQuery(filters, PageSize));
  const { summary } = result;
  const offset = result.offset ?? Number(filters.cursor ?? 0);
  const total = result.total ?? result.items.length;
  const first = total === 0 ? 0 : offset + 1;
  const last = offset + result.items.length;
  const pageHref = (start: number) => complianceHref({ ...filters, cursor: start > 0 ? String(start) : null });
  const pager = 'inline-flex h-9 items-center rounded-md border px-4 text-[13.5px] font-medium';

  return (
    <>
      <PageHeader
        title="Compliance"
        description={`Alerts on investors and orders that need a look${summary.lastScanAt ? ` · checked ${timeAgo(summary.lastScanAt)}` : ''}`}
        actions={
          canExport ? (
            <Link
              href="/reports/compliance"
              className="inline-flex h-9.5 items-center rounded-md border border-line-strong bg-surface px-4 text-[13.5px] font-semibold text-ink hover:bg-surface-sunken"
            >
              Export
            </Link>
          ) : null
        }
      />

      <div className="space-y-5">
        <MetricSection
          columns={4}
          metrics={[
            { label: 'Open alerts', value: formatCount(summary.open), caption: `${formatCount(summary.unassigned)} unassigned` },
            { label: 'High severity', value: formatCount(summary.high), hint: 'Money moved without units, or a SIP that cannot debit.', href: complianceHref({ view: 'high' }) },
            { label: 'Open over 7 days', value: formatCount(summary.ageingOver7Days), hint: 'Past the internal SLA.' },
            { label: 'Resolved in 30 days', value: formatCount(summary.resolvedLast30Days), href: complianceHref({ view: 'resolved' }) },
          ]}
        />

        <Card>
          <form method="get" action="/compliance" className="flex flex-wrap items-end gap-2 border-b border-line px-4 py-3">
            <label className="min-w-[220px] flex-1">
              <span className="mb-1.5 block text-[12.5px] text-ink-soft">Search</span>
              <span className="relative block">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
                <input name="q" defaultValue={filters.q} maxLength={100} placeholder="Investor, scheme or words in the alert" className={cn(Control, 'w-full pl-9')} />
              </span>
            </label>
            <label className="w-full sm:w-auto">
              <span className="mb-1.5 block text-[12.5px] text-ink-soft">Status</span>
              <select name="view" defaultValue={filters.view} className={cn(Control, 'w-full pr-8 sm:w-auto')}>
                {ComplianceViews.map((v) => (
                  <option key={v} value={v}>
                    {ViewLabel[v]}
                  </option>
                ))}
              </select>
            </label>
            <label className="w-full sm:w-auto">
              <span className="mb-1.5 block text-[12.5px] text-ink-soft">Alert type</span>
              <select name="kind" defaultValue={filters.kind ?? ''} className={cn(Control, 'w-full pr-8 sm:w-auto')}>
                <option value="">All types</option>
                {summary.byKind.map((k) => (
                  <option key={k.key} value={k.key}>
                    {KindLabel[k.key]} ({formatCount(k.count)})
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="h-9 rounded-md bg-brand px-4 text-[13.5px] font-medium text-white hover:bg-brand-strong">
              Apply
            </button>
          </form>

          <AlertTable alerts={result.items} />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
            <p className="text-[12.5px] text-ink-muted">
              Showing {formatCount(first)}–{formatCount(last)} of {formatCount(total)}
            </p>
            <div className="flex gap-2">
              {offset > 0 ? (
                <Link href={pageHref(Math.max(0, offset - PageSize))} className={cn(pager, 'border-line-strong text-ink hover:bg-surface-sunken')}>
                  Previous
                </Link>
              ) : (
                <span className={cn(pager, 'cursor-not-allowed border-line text-ink-muted')}>Previous</span>
              )}
              {result.nextCursor ? (
                <Link href={pageHref(offset + PageSize)} className={cn(pager, 'border-brand bg-brand text-white hover:bg-brand-strong')}>
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

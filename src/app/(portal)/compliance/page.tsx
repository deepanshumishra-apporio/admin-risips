import { ChevronRight, Download, Search } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { StatStrip } from '@/components/ui/stat-strip';
import { AlertTable } from '@/features/compliance/components/alert-table';
import { RunChecksButton } from '@/features/compliance/components/run-checks-button';
import {
  complianceHref,
  ComplianceViews,
  KindLabel,
  KindRule,
  parseComplianceFilters,
  toComplianceQuery,
  ViewLabel,
} from '@/features/compliance/labels';
import { listComplianceAlerts } from '@/lib/api/compliance';
import { hasPermission } from '@/lib/auth/session';
import { cn } from '@/utils/cn';
import { formatCount, timeAgo } from '@/utils/format';

export const metadata: Metadata = { title: 'Compliance · RiSips Admin' };

const PageSize = 50;

type CompliancePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function closeTime(hours: number | null): string {
  if (hours === null) return '—';
  return hours < 48 ? `${hours.toFixed(1)} h` : `${(hours / 24).toFixed(1)} d`;
}

export default async function CompliancePage({ searchParams }: CompliancePageProps): Promise<React.JSX.Element> {
  const [canManage, canExport] = await Promise.all([hasPermission('compliance.manage'), hasPermission('reports.read')]);
  const header = (
    <PageHeader
      title="Compliance"
      description="Conditions the platform checks for every 10 minutes: stalled or failed KYC, repeated SIP failures, mandate problems, money collected without units, and holdings with no nominee."
      {...(canManage && {
        actions: (
          <>
            <RunChecksButton />
            {canExport ? (
              <Link
                href="/reports/compliance"
                className="inline-flex h-9.5 items-center gap-2 rounded-md border border-line-strong bg-surface px-4 text-[13.5px] font-medium text-ink transition-colors hover:bg-surface-sunken"
              >
                <Download className="size-4" />
                Export queue
              </Link>
            ) : null}
          </>
        ),
      })}
    />
  );
  if (!canManage) {
    return (
      <>
        {header}
        <NoAccess what="the compliance queue" />
      </>
    );
  }

  const filters = parseComplianceFilters(await searchParams);
  const result = await listComplianceAlerts(toComplianceQuery(filters, PageSize));
  const { summary } = result;

  return (
    <>
      {header}

      <StatStrip
        className="mb-5"
        items={[
          { label: 'Open alerts', value: formatCount(summary.open), caption: `${formatCount(summary.unassigned)} unassigned` },
          { label: 'High severity', value: formatCount(summary.high), hint: 'Money moved without units, or a SIP that cannot debit.', caption: 'act on these today' },
          { label: 'Open over 7 days', value: formatCount(summary.ageingOver7Days), caption: 'past the internal SLA' },
          { label: 'Median time to close', value: closeTime(summary.medianHoursToClose), caption: `${formatCount(summary.resolvedLast30Days)} closed in 30 days` },
          { label: 'Last checked', value: summary.lastScanAt ? timeAgo(summary.lastScanAt) : 'never', caption: 'runs every 10 minutes' },
        ]}
      />

      <nav aria-label="Alert views" className="mb-3 flex flex-wrap gap-1.5">
        {ComplianceViews.map((view) => (
          <Link
            key={view}
            href={complianceHref({ view, kind: filters.kind, q: filters.q })}
            className={cn(
              'rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors',
              filters.view === view ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line-strong text-ink-soft hover:bg-surface-sunken',
            )}
          >
            {ViewLabel[view]}
          </Link>
        ))}
      </nav>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" aria-label="Alert types">
          <Link
            href={complianceHref({ view: filters.view, q: filters.q })}
            className={cn('rounded-md border px-2.5 py-1 text-[12px] font-medium', !filters.kind ? 'border-ink/30 bg-surface-sunken text-ink' : 'border-line text-ink-muted hover:text-ink')}
          >
            All types
          </Link>
          {summary.byKind.map((kind) => (
            <Link
              key={kind.key}
              href={complianceHref({ view: filters.view, kind: kind.key, q: filters.q })}
              title={KindRule[kind.key]}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-medium',
                filters.kind === kind.key ? 'border-ink/30 bg-surface-sunken text-ink' : 'border-line text-ink-muted hover:text-ink',
              )}
            >
              {KindLabel[kind.key]}
              <span className={cn('tabular', kind.count > 0 ? 'text-ink' : 'opacity-60')}>{formatCount(kind.count)}</span>
            </Link>
          ))}
        </div>

        <form method="get" action="/compliance" className="flex items-center gap-2">
          {filters.view !== 'open' ? <input type="hidden" name="view" value={filters.view} /> : null}
          {filters.kind ? <input type="hidden" name="kind" value={filters.kind} /> : null}
          <span className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
            <input
              name="q"
              defaultValue={filters.q}
              maxLength={100}
              placeholder="Investor, scheme or words in the alert"
              className="h-9 w-[280px] rounded-md border border-line-strong bg-surface pr-3 pl-9 text-[13.5px] text-ink focus:border-brand focus:ring-3 focus:ring-brand/12 focus:outline-none"
            />
          </span>
          <button type="submit" className="h-9 rounded-md bg-brand px-4 text-[13.5px] font-medium text-white hover:bg-brand-strong">
            Search
          </button>
        </form>
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <p className="text-[12.5px] text-ink-muted">
            {filters.view === 'resolved' || filters.view === 'dismissed' ? 'Most recently closed first' : 'Most severe first, then oldest'} · investor identifiers masked
          </p>
        </div>
        <AlertTable alerts={result.items} />
        {filters.cursor || result.nextCursor ? (
          <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
            {filters.cursor ? (
              <Link href={complianceHref({ ...filters, cursor: null })} className="text-[13px] font-medium text-brand hover:text-brand-deep">
                Back to first page
              </Link>
            ) : (
              <span />
            )}
            {result.nextCursor ? (
              <Link href={complianceHref({ ...filters, cursor: result.nextCursor })} className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:text-brand-deep">
                Next {PageSize}
                <ChevronRight className="size-4" />
              </Link>
            ) : null}
          </div>
        ) : null}
      </Card>
    </>
  );
}

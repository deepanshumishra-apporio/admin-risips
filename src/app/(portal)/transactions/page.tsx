import { ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { StatStrip } from '@/components/ui/stat-strip';
import { TransactionFiltersBar } from '@/features/transactions/components/transaction-filters';
import { TransactionTable } from '@/features/transactions/components/transaction-table';
import { FlagHint, FlagTone } from '@/features/transactions/labels';
import { parseTransactionFilters, toTransactionQuery, transactionsHref } from '@/features/transactions/search-params';
import { getTransactionSummary, listTransactions } from '@/lib/api/transactions';
import { hasPermission } from '@/lib/auth/session';
import { cn } from '@/utils/cn';
import { formatCount, formatDateTime, formatInrString } from '@/utils/format';

export const metadata: Metadata = { title: 'Transactions · RiSips Admin' };

const PageSize = 50;

type TransactionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TransactionsPage({ searchParams }: TransactionsPageProps): Promise<React.JSX.Element> {
  const header = (
    <PageHeader
      title="Transactions"
      description="Every order across investors — purchases, redemptions, switches and plan instalments — with the ones that need someone flagged."
    />
  );
  if (!(await hasPermission('transactions.read'))) {
    return (
      <>
        {header}
        <NoAccess what="transaction monitoring" />
      </>
    );
  }

  const filters = parseTransactionFilters(await searchParams);
  const [summary, result] = await Promise.all([getTransactionSummary(), listTransactions(toTransactionQuery(filters, PageSize))]);
  const onLaterPage = filters.cursor !== null;
  const needsAttention = summary.attention.reduce((sum, flag) => sum + flag.count, 0);
  const maxDaily = Math.max(1, ...summary.daily.map((day) => day.placed));

  return (
    <>
      {header}

      <StatStrip
        className="mb-5"
        items={[
          { label: 'Placed today', value: formatCount(summary.today.placed), caption: `${formatCount(summary.today.successful)} completed · ${formatCount(summary.today.failed)} failed` },
          { label: 'Purchases today', value: formatInrString(summary.today.purchaseAmount), caption: `Redemptions ${formatInrString(summary.today.redemptionAmount)}` },
          { label: 'In flight', value: formatCount(summary.inFlight), hint: 'Under review, pending, confirmed or with the RTA.' },
          { label: 'Needs attention', value: formatCount(needsAttention), caption: 'open problems now' },
          {
            label: 'Payments today',
            value: formatInrString(summary.paymentsToday.amountCollected),
            caption: `${formatCount(summary.paymentsToday.successful)} ok · ${formatCount(summary.paymentsToday.failed)} failed · ${formatCount(summary.paymentsToday.pending)} pending`,
          },
        ]}
      />

      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card>
          <CardHeader title="Needs attention" subtitle="Open problems, most urgent first" />
          <ul className="divide-y divide-line">
            {summary.attention.map((flag) => (
              <li key={flag.key}>
                <Link
                  href={transactionsHref({ flag: [flag.key] })}
                  title={FlagHint[flag.key]}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-surface-sunken"
                >
                  <Badge tone={flag.count > 0 ? FlagTone[flag.key] : 'neutral'} dot>
                    {flag.label}
                  </Badge>
                  <span className="flex items-center gap-1 text-[13px]">
                    <span className={cn('tabular font-semibold', flag.count > 0 ? 'text-ink' : 'text-ink-muted')}>{formatCount(flag.count)}</span>
                    <ChevronRight className="size-4 text-ink-muted" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Last 14 days" subtitle="Orders placed per day, and how they ended" />
          <div className="flex h-[168px] items-end gap-1.5 px-4 pt-3 pb-2" role="img" aria-label="Orders placed per day for the last 14 days">
            {summary.daily.map((day) => (
              <div key={day.date} className="flex h-full flex-1 flex-col justify-end" title={`${day.date}: ${day.placed} placed, ${day.successful} successful, ${day.failed} failed`}>
                <div className="flex flex-col-reverse overflow-hidden rounded-sm bg-line" style={{ height: `${Math.max(2, (day.placed / maxDaily) * 100)}%` }}>
                  <div className="bg-success" style={{ height: `${day.placed ? (day.successful / day.placed) * 100 : 0}%` }} />
                  <div className="bg-danger" style={{ height: `${day.placed ? (day.failed / day.placed) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="flex gap-3 px-4 pb-3 text-[11.5px] text-ink-muted">
            <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-success" /> Successful</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-danger" /> Failed</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-line" /> Other</span>
          </p>
        </Card>

        <Card>
          <CardHeader title="Top failure reasons" subtitle="Last 30 days" />
          {summary.topFailures.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-ink-muted">No failures in the last 30 days.</p>
          ) : (
            <ul className="divide-y divide-line">
              {summary.topFailures.map((failure) => (
                <li key={failure.reason} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
                  <span className="min-w-0 truncate text-ink-soft" title={failure.reason}>{failure.reason}</span>
                  <span className="tabular font-semibold text-ink">{formatCount(failure.count)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <TransactionFiltersBar filters={filters} />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
          <p className="text-[12.5px] text-ink-muted">
            Newest first{onLaterPage ? ' · showing a later page' : ''} · click a row for the full order
          </p>
          <p className="text-[12px] text-ink-muted">Updated {formatDateTime(summary.generatedAt)} · refreshing an order is logged</p>
        </div>

        <TransactionTable orders={result.items} />

        {onLaterPage || result.nextCursor ? (
          <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
            {onLaterPage ? (
              <Link href={transactionsHref({ ...filters, cursor: null })} className="text-[13px] font-medium text-brand hover:text-brand-deep">
                Back to first page
              </Link>
            ) : (
              <span />
            )}
            {result.nextCursor ? (
              <Link
                href={transactionsHref({ ...filters, cursor: result.nextCursor })}
                className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:text-brand-deep"
              >
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

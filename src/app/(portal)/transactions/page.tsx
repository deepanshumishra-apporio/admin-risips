import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { MetricSection } from '@/features/dashboard/components/metric-section';
import { ExportTransactions } from '@/features/transactions/components/export-dialog';
import { TransactionFiltersBar } from '@/features/transactions/components/transaction-filters';
import { TransactionTable } from '@/features/transactions/components/transaction-table';
import { parseTransactionFilters, toTransactionQuery, transactionsHref } from '@/features/transactions/search-params';
import { listTransactions } from '@/lib/api/transactions';
import { hasPermission } from '@/lib/auth/session';
import { cn } from '@/utils/cn';
import { formatCount, formatInrString } from '@/utils/format';

export const metadata: Metadata = { title: 'Transactions · RiSips Admin' };

const PageSize = 10;

type TransactionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TransactionsPage({ searchParams }: TransactionsPageProps): Promise<React.JSX.Element> {
  const header = (actions?: React.ReactNode) => (
    <PageHeader title="Transactions" description="Purchases, redemptions, switches and SIP instalments across all investors" actions={actions} />
  );
  if (!(await hasPermission('transactions.read'))) {
    return (
      <>
        {header()}
        <NoAccess what="transactions" />
      </>
    );
  }

  const filters = parseTransactionFilters(await searchParams);
  const result = await listTransactions(toTransactionQuery(filters, PageSize));
  const offset = result.offset ?? Number(filters.cursor ?? 0);
  const total = result.total ?? result.items.length;
  const totals = result.totals;
  const first = total === 0 ? 0 : offset + 1;
  const last = offset + result.items.length;
  const pageHref = (start: number) => transactionsHref({ ...filters, cursor: start > 0 ? String(start) : null });
  const pager = 'inline-flex h-9 items-center rounded-md border px-4 text-[13.5px] font-medium';

  return (
    <>
      {header(<ExportTransactions search={transactionsHref({ ...filters, cursor: null }).split('?')[1] ?? ''} total={total} />)}

      <div className="space-y-5">
        {totals ? (
          <MetricSection
            columns={4}
            metrics={[
              { label: 'Total transactions', value: formatCount(totals.count) },
              { label: 'Transaction value', value: formatInrString(totals.value), hint: 'Successful transactions only, in rupees.' },
              { label: 'Pending transactions', value: formatCount(totals.pending), hint: 'Under review, pending, confirmed or with the RTA.' },
              { label: 'Failed transactions', value: formatCount(totals.failed), hint: 'Failed or reversed.', href: transactionsHref({ ...filters, state: ['FAILED'], cursor: null }) },
            ]}
          />
        ) : null}

        <Card>
          <TransactionFiltersBar filters={filters} />
          <TransactionTable orders={result.items} />
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

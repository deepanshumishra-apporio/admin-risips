import { Download } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { MetricSection } from '@/features/dashboard/components/metric-section';
import { SipFiltersBar } from '@/features/sips/components/sip-filters';
import { SipTable } from '@/features/sips/components/sip-table';
import { parseSipFilters, sipsHref, toSipQuery } from '@/features/sips/search-params';
import { getSipSummary, listSips } from '@/lib/api/sips';
import { hasPermission } from '@/lib/auth/session';
import { cn } from '@/utils/cn';
import { formatCount, formatInrString } from '@/utils/format';

export const metadata: Metadata = { title: 'Active SIPs · RiSips Admin' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ActiveSipsPage({ searchParams }: Props): Promise<React.JSX.Element> {
  if (!(await hasPermission('transactions.read'))) {
    return (
      <>
        <PageHeader title="Active SIPs" />
        <NoAccess what="SIPs" />
      </>
    );
  }

  const filters = parseSipFilters(await searchParams);
  const [summary, list] = await Promise.all([getSipSummary(), listSips(toSipQuery(filters))]);
  const first = list.total === 0 ? 0 : list.offset + 1;
  const last = list.offset + list.items.length;
  const pager = 'inline-flex h-9 items-center rounded-md border px-4 text-[13.5px] font-medium';

  return (
    <>
      <PageHeader
        title="Active SIPs"
        description="All running systematic investment plans, by investor and scheme."
        actions={
          <Link
            href={sipsHref({ ...filters, page: 1 }, '/orders/sips/export')}
            prefetch={false}
            className="inline-flex h-9.5 items-center gap-2 rounded-md border border-line-strong bg-surface px-4 text-[13.5px] font-medium text-ink hover:bg-surface-sunken"
          >
            <Download className="size-4" />
            Export
          </Link>
        }
      />

      <div className="space-y-5">
        <MetricSection
          columns={4}
          metrics={[
            { label: 'Active SIPs', value: formatCount(summary.activeSips), caption: `${formatCount(summary.paused)} paused` },
            {
              label: 'Monthly SIP book',
              value: formatInrString(summary.monthlyBook),
              hint: 'Every running SIP as a monthly amount: a weekly ₹1,000 counts as ₹4,333.',
            },
            {
              label: 'Avg SIP per client',
              value: formatInrString(summary.averagePerInvestor),
              hint: 'Monthly SIP book divided by the investors who have a running SIP.',
              caption: `${formatCount(summary.investors)} investors`,
            },
            {
              label: 'Bounced SIPs',
              value: formatCount(summary.bounced),
              hint: 'Running SIPs whose latest instalment failed.',
              href: sipsHref({ status: 'BOUNCED' }),
            },
          ]}
        />

        <Card>
          <SipFiltersBar filters={filters} amcs={summary.amcs} />
          <SipTable sips={list.items} />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
            <p className="text-[12.5px] text-ink-muted">
              Showing {formatCount(first)}–{formatCount(last)} of {formatCount(list.total)}
            </p>
            <div className="flex gap-2">
              {filters.page > 1 ? (
                <Link href={sipsHref({ ...filters, page: filters.page - 1 })} className={cn(pager, 'border-line-strong text-ink hover:bg-surface-sunken')}>
                  Previous
                </Link>
              ) : (
                <span className={cn(pager, 'cursor-not-allowed border-line text-ink-muted')}>Previous</span>
              )}
              {list.nextCursor ? (
                <Link href={sipsHref({ ...filters, page: filters.page + 1 })} className={cn(pager, 'border-brand bg-brand text-white hover:bg-brand-strong')}>
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

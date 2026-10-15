import { ArrowRight, Download } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { InvestorFiltersBar } from '@/features/investors/components/investor-filters';
import { InvestorTable } from '@/features/investors/components/investor-table';
import { StageOverview } from '@/features/investors/components/stage-overview';
import {
  exportHref,
  investorsHref,
  MaxShow,
  PageStep,
  parseInvestorFilters,
  toListQuery,
  type InvestorFilters,
} from '@/features/investors/search-params';
import { loadInvestorOverview } from '@/features/investors/overview';
import { listInvestors } from '@/lib/api/admin';
import { hasPermission } from '@/lib/auth/session';
import { formatCount } from '@/utils/format';

export const metadata: Metadata = { title: 'Investors · RiSips Admin' };

type InvestorsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** What the view on screen has in common, for the line above the table. */
function viewNote(filters: InvestorFilters): string | null {
  if (filters.attention === 'KYC') return 'stuck in KYC: check failed, expired or not moving';
  if (filters.attention === 'SETUP') return 'KYC done, account not ready to invest';
  if (filters.stalled) return 'KYC has not moved for a while';
  if (filters.sipDue !== null) return `a SIP instalment due in the next ${filters.sipDue} days`;
  const stages = filters.stage;
  if (stages.length === 1 && stages[0] === 'INVESTED') return 'all have invested';
  if (stages.length === 1 && stages[0] === 'READY_TO_INVEST') return 'all have completed KYC in this view';
  if (stages.length && stages.every((stage) => stage === 'SIGNED_UP')) return "haven't started KYC";
  return null;
}

export default async function InvestorsPage({ searchParams }: InvestorsPageProps): Promise<React.JSX.Element> {
  const description = 'Everyone who has signed up, how far they have got, and their money with us.';
  if (!(await hasPermission('investors.read'))) {
    return (
      <>
        <PageHeader title="Investors" description={description} />
        <NoAccess what="investor records" />
      </>
    );
  }

  const params = await searchParams;
  const filters = parseInvestorFilters(params);
  const [overview, result, canNudge] = await Promise.all([
    loadInvestorOverview(),
    listInvestors(toListQuery(filters)),
    hasPermission('announcements.manage'),
  ]);
  const onLaterPage = filters.cursor !== null;
  const note = viewNote(filters);
  const exportFailed = typeof params['exportFailed'] === 'string' ? params['exportFailed'] : null;

  return (
    <>
      <PageHeader
        title="Investors"
        description={description}
        actions={
          <a
            href={exportHref(filters)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-line-strong bg-surface px-4 text-[14px] font-semibold text-ink transition-colors hover:bg-surface-sunken"
          >
            <Download className="size-4" />
            Export list
          </a>
        }
      />

      {exportFailed ? (
        <p className="mb-4 rounded-md border border-danger/25 bg-danger-soft px-4 py-2.5 text-[13px] text-danger">
          {exportFailed === 'forbidden'
            ? 'Your role cannot export investor data. Ask an admin for the reports permission.'
            : exportFailed === 'unavailable'
              ? 'Exporting a filtered or searched list needs the latest API. Until it is deployed, export all investors or a single stage.'
              : 'The export did not finish. Try again in a moment.'}
        </p>
      ) : null}

      {overview ? <StageOverview overview={overview} filters={filters} /> : null}

      <Card>
        <InvestorFiltersBar filters={filters} overview={overview} />

        <div className="flex flex-wrap items-center justify-between gap-2 px-6 pt-4 pb-3 text-[13px] text-ink-muted">
          <p>
            <span className="tabular font-semibold text-ink">{formatCount(result.total)}</span>{' '}
            {result.total === 1 ? 'investor' : 'investors'}
            {note ? ` · ${note}` : ''}
          </p>
          {canNudge ? <p>Select investors to message them together</p> : null}
        </div>

        <InvestorTable investors={result.items} canNudge={canNudge} />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4 text-[13px]">
          <p className="text-ink-muted">
            {onLaterPage ? 'A later page · ' : ''}Showing {formatCount(result.items.length)} of {formatCount(result.total)} investors
          </p>
          <div className="flex items-center gap-5">
            {onLaterPage ? (
              <Link href={investorsHref(filters, { cursor: null, show: PageStep })} className="font-medium text-ink-muted hover:text-ink">
                Back to the start
              </Link>
            ) : null}
            {result.nextCursor ? (
              <Link
                href={
                  filters.show < MaxShow
                    ? investorsHref(filters, { show: Math.min(filters.show + PageStep, MaxShow) })
                    : investorsHref(filters, { cursor: result.nextCursor })
                }
                scroll={false}
                className="inline-flex items-center gap-1.5 font-semibold text-brand hover:text-brand-deep"
              >
                {filters.show < MaxShow ? 'Load more' : `Next ${MaxShow}`}
                <ArrowRight className="size-4" />
              </Link>
            ) : null}
          </div>
        </div>
      </Card>
    </>
  );
}

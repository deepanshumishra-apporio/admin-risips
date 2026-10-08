import { ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { InvestorFiltersBar } from '@/features/investors/components/investor-filters';
import { InvestorTable } from '@/features/investors/components/investor-table';
import { investorsHref, parseInvestorFilters, toListQuery } from '@/features/investors/search-params';
import { listInvestors } from '@/lib/api/admin';
import { hasPermission } from '@/lib/auth/session';
import { formatCount } from '@/utils/format';

export const metadata: Metadata = { title: 'Investors · RiSips Admin' };

const PageSize = 25;

type InvestorsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InvestorsPage({ searchParams }: InvestorsPageProps): Promise<React.JSX.Element> {
  const header = (
    <PageHeader title="Investors" />
  );
  if (!(await hasPermission('investors.read'))) {
    return (
      <>
        {header}
        <NoAccess what="investor records" />
      </>
    );
  }

  const filters = parseInvestorFilters(await searchParams);
  const result = await listInvestors(toListQuery(filters, PageSize));
  const onLaterPage = filters.cursor !== null;

  return (
    <>
      {header}
      <InvestorFiltersBar filters={filters} />

      <Card>
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <p className="text-[12.5px] text-ink-muted">
            <span className="tabular font-semibold text-ink">{formatCount(result.total)}</span>{' '}
            {result.total === 1 ? 'investor' : 'investors'}
            {onLaterPage ? ' · showing a later page' : ''}
          </p>
        </div>

        <InvestorTable investors={result.items} />

        {onLaterPage || result.nextCursor ? (
          <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
            {onLaterPage ? (
              <Link href={investorsHref(filters)} className="text-[13px] font-medium text-brand hover:text-brand-deep">
                Back to first page
              </Link>
            ) : (
              <span />
            )}
            {result.nextCursor ? (
              <Link
                href={investorsHref(filters, { cursor: result.nextCursor })}
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

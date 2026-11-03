import { ArrowLeft, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { NoAccess } from '@/components/ui/no-access';
import { FundExplorer, fundQueryOf, pageHrefOf } from '@/features/hufs/components/fund-explorer';
import { fundsOf } from '@/features/hufs/portfolio';
import { ApiError } from '@/lib/api/errors';
import { getHuf, getHufInvestments, listHufFunds } from '@/lib/api/hufs';
import { hasPermission } from '@/lib/auth/session';
import type { HufDetail, HufFundList, HufInvestmentsView } from '@/types/admin-api.types';

export const metadata: Metadata = { title: 'Mutual funds · RiSips Admin' };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Every mutual fund the HUF can buy on NSE, by asset class, category and fund house; each opens its own screen. */
export default async function HufFundsPage({ params, searchParams }: Props): Promise<React.JSX.Element> {
  const { id } = await params;
  if (!(await hasPermission('hufs.manage'))) {
    return (
      <>
        <PageHeader title="Mutual funds" />
        <NoAccess what="HUF onboarding" />
      </>
    );
  }
  const { values, query } = fundQueryOf(await searchParams);
  let huf: HufDetail;
  let view: HufInvestmentsView;
  try {
    [huf, view] = await Promise.all([getHuf(id), getHufInvestments(id)]);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }
  let list: HufFundList | null = null;
  let listError: string | null = null;
  try {
    list = await listHufFunds(query);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    listError = error.message;
  }
  const held = new Set(view.investments ? fundsOf(view.investments).filter((f) => f.units > 0).map((f) => f.schemeCode) : []);
  const base = `/onboarding/hufs/${id}/funds`;

  return (
    <>
      <Link href={`/onboarding/hufs/${id}?tab=portfolio`} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-3.5" />
        {huf.hufName} · Portfolio
      </Link>
      <PageHeader
        title="Mutual funds"
        description="Every fund open for purchase on NSE, with AMFI's categories. Open one for its NAV chart, returns, rules and the HUF's position in it."
        actions={
          !view.block ? (
            <Link href={`/onboarding/hufs/${id}/invest`} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-[13px] font-semibold text-white hover:bg-brand-strong">
              <Plus className="size-3.5" />
              Invest
            </Link>
          ) : undefined
        }
      />
      {list ? (
        <FundExplorer list={list} values={values} hrefFor={(code) => `${base}/${encodeURIComponent(code)}`} pageHref={pageHrefOf(base, values)} held={held} />
      ) : (
        <p className="rounded-md border border-danger/25 bg-danger-soft px-4 py-2.5 text-[13px] text-danger">NSE&apos;s fund list couldn&apos;t be read: {listError}</p>
      )}
    </>
  );
}

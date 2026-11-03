import { ArrowLeft, ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { NoAccess } from '@/components/ui/no-access';
import { FundExplorer, fundName, fundQueryOf, pageHrefOf } from '@/features/hufs/components/fund-explorer';
import { InvestSteps } from '@/features/hufs/components/invest-wizard';
import { fundsOf, inr } from '@/features/hufs/portfolio';
import { ApiError } from '@/lib/api/errors';
import { getHuf, getHufInvestments, listHufFunds } from '@/lib/api/hufs';
import { hasPermission } from '@/lib/auth/session';
import type { HufDetail, HufFundList, HufInvestmentsView } from '@/types/admin-api.types';

export const metadata: Metadata = { title: 'Invest for a HUF · RiSips Admin' };

type InvestPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Step 1 of investing for a HUF: choose the fund, from those it already holds or from every fund open for purchase
 * on NSE. The amount, review and NSE's link for the karta follow on the fund's own step.
 */
export default async function HufInvestPage({ params, searchParams }: InvestPageProps): Promise<React.JSX.Element> {
  const { id } = await params;
  if (!(await hasPermission('hufs.manage'))) {
    return (
      <>
        <PageHeader title="Invest" />
        <NoAccess what="HUF onboarding" />
      </>
    );
  }
  const sp = await searchParams;
  // Old links chose the fund in the query.
  const legacy = typeof sp['scheme'] === 'string' ? sp['scheme'] : '';
  if (legacy) redirect(`/onboarding/hufs/${id}/invest/${encodeURIComponent(legacy)}${sp['tab'] === 'sip' ? '?type=sip' : ''}`);

  const { values, query } = fundQueryOf(sp);
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
  if (!view.block) {
    try {
      list = await listHufFunds(query);
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      listError = error.message;
    }
  }
  const held = view.investments ? fundsOf(view.investments).filter((f) => f.units > 0) : [];
  const base = `/onboarding/hufs/${id}/invest`;

  return (
    <>
      <Link href={`/onboarding/hufs/${id}?tab=portfolio`} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-3.5" />
        {huf.hufName} · Portfolio
      </Link>
      <PageHeader
        title="Invest"
        description={`For ${huf.hufName} (${huf.clientCode})${view.live ? ', on NSE’s live account' : ''}. Every order and SIP needs the karta’s OTP; the money comes only from the HUF’s own bank account.`}
      />

      {view.block ? (
        <p className="rounded-md border border-warn/25 bg-warn-soft px-4 py-2.5 text-[13px] text-warn">Can&apos;t invest yet: {view.block}</p>
      ) : (
        <>
          <InvestSteps current={1} />
          {held.length ? (
            <section className="mb-6">
              <h2 className="mb-2 text-[13px] font-semibold text-ink">Add to a fund the HUF holds</h2>
              <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {held.map((f) => (
                  <li key={f.schemeCode}>
                    <Link
                      href={`${base}/${encodeURIComponent(f.schemeCode)}`}
                      className="group flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition-colors hover:border-brand/40 hover:bg-brand-soft/40"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-ink group-hover:text-brand">{fundName({ name: f.schemeName })}</span>
                        <span className="tabular block text-[12px] text-ink-muted">Worth {inr(f.value ?? f.invested)}</span>
                      </span>
                      <ChevronRight className="size-4 text-ink-muted group-hover:text-brand" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <h2 className="mb-2 text-[13px] font-semibold text-ink">{held.length ? 'Or choose any fund' : 'Choose a fund'}</h2>
          {list ? (
            <FundExplorer
              list={list}
              values={values}
              hrefFor={(code) => `${base}/${encodeURIComponent(code)}`}
              pageHref={pageHrefOf(base, values)}
              held={new Set(held.map((f) => f.schemeCode))}
            />
          ) : (
            <p className="rounded-md border border-danger/25 bg-danger-soft px-4 py-2.5 text-[13px] text-danger">NSE&apos;s fund list couldn&apos;t be read: {listError}</p>
          )}
        </>
      )}
    </>
  );
}

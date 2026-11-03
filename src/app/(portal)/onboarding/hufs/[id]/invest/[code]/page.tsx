import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { NoAccess } from '@/components/ui/no-access';
import { fundName } from '@/features/hufs/components/fund-explorer';
import { FundSummary } from '@/features/hufs/components/fund-bits';
import { InvestWizard } from '@/features/hufs/components/invest-wizard';
import { ApiError } from '@/lib/api/errors';
import { getHuf, getHufInvestments, getHufScheme, getHufSchemeHistory } from '@/lib/api/hufs';
import { hasPermission } from '@/lib/auth/session';
import type { HufDetail, HufInvestmentsView, HufScheme } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

export const metadata: Metadata = { title: 'Invest for a HUF · RiSips Admin' };

type Props = {
  params: Promise<{ id: string; code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Steps 2 to 4 of investing for a HUF in one fund: a lumpsum or a monthly SIP, reviewed, then sent to NSE. */
export default async function HufInvestInFundPage({ params, searchParams }: Props): Promise<React.JSX.Element> {
  const { id, code: rawCode } = await params;
  const code = decodeURIComponent(rawCode).toUpperCase();
  if (!(await hasPermission('hufs.manage'))) {
    return (
      <>
        <PageHeader title="Invest" />
        <NoAccess what="HUF onboarding" />
      </>
    );
  }
  let huf: HufDetail;
  let view: HufInvestmentsView;
  let scheme: HufScheme;
  try {
    [huf, view, scheme] = await Promise.all([getHuf(id), getHufInvestments(id), getHufScheme(code)]);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }
  const history = await getHufSchemeHistory(code).catch(() => null);
  const asked = (await searchParams)['type'] === 'sip' ? 'sip' : 'lumpsum';
  const kind = asked === 'sip' && scheme.sipMonthly ? 'sip' : 'lumpsum';
  const folios = view.folios.filter((f) => f.schemeCode === code).map((f) => f.folio);
  const base = `/onboarding/hufs/${id}/invest`;
  const fundHref = `/onboarding/hufs/${id}/funds/${encodeURIComponent(code)}`;

  return (
    <>
      <Link href={base} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-3.5" />
        Choose another fund
      </Link>
      <PageHeader title={kind === 'sip' ? 'Start a monthly SIP' : 'Invest a lumpsum'} description={`For ${huf.hufName} (${huf.clientCode}) in ${fundName(scheme)}.`} />

      {view.block ? (
        <p className="rounded-md border border-warn/25 bg-warn-soft px-4 py-2.5 text-[13px] text-warn">Can&apos;t invest yet: {view.block}</p>
      ) : !scheme.purchaseAllowed ? (
        <p className="rounded-md border border-warn/25 bg-warn-soft px-4 py-2.5 text-[13px] text-warn">This fund isn&apos;t open for purchase on NSE just now.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <nav className="mb-5 inline-flex rounded-lg bg-surface-sunken p-1" aria-label="How to invest">
              {(['lumpsum', 'sip'] as const).map((t) => {
                const off = t === 'sip' && !scheme.sipMonthly;
                const cls = cn(
                  'rounded-md px-4 py-1.5 text-[13px] font-semibold transition-colors',
                  kind === t ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink',
                  off && 'cursor-not-allowed opacity-50 hover:text-ink-muted',
                );
                const label = t === 'lumpsum' ? 'Lumpsum' : off ? 'Monthly SIP (not offered)' : 'Monthly SIP';
                return off ? (
                  <span key={t} className={cls}>
                    {label}
                  </span>
                ) : (
                  <Link key={t} href={`${base}/${encodeURIComponent(code)}${t === 'sip' ? '?type=sip' : ''}`} aria-current={kind === t ? 'page' : undefined} className={cls}>
                    {label}
                  </Link>
                );
              })}
            </nav>
            <InvestWizard
              key={kind}
              hufId={id}
              hufName={huf.hufName}
              scheme={scheme}
              kind={kind}
              folios={folios}
              mandates={view.approvedMandates}
              live={view.live}
              mandateHref={`${base}/mandate?fund=${encodeURIComponent(code)}`}
            />
          </div>
          <aside>
            <FundSummary scheme={scheme} history={history} href={fundHref} />
          </aside>
        </div>
      )}
    </>
  );
}

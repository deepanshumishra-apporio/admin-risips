import { ArrowLeft, Search } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { MandateForm, PurchaseForm, SipForm } from '@/features/hufs/components/invest-forms';
import { ApiError } from '@/lib/api/errors';
import { getHuf, getHufInvestments, searchHufSchemes } from '@/lib/api/hufs';
import { hasPermission } from '@/lib/auth/session';
import type { HufDetail, HufInvestmentsView, HufScheme } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

export const metadata: Metadata = { title: 'Invest for a HUF · RiSips Admin' };

type InvestPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] ?? '' : v ?? '').trim();

/**
 * Invest for a HUF: find the scheme, then a lumpsum purchase or a monthly SIP. Search and choice live in the URL;
 * each submit goes to NSE, which then asks the karta to confirm.
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
  const q = first(sp['q']).slice(0, 80);
  const chosenCode = first(sp['scheme']).toUpperCase();
  const tab = first(sp['tab']) === 'sip' ? 'sip' : 'lumpsum';

  let huf: HufDetail;
  let view: HufInvestmentsView;
  try {
    [huf, view] = await Promise.all([getHuf(id), getHufInvestments(id)]);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }
  let results: HufScheme[] = [];
  let searchError: string | null = null;
  try {
    results = q.length >= 3 ? await searchHufSchemes(q) : [];
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    searchError = error.message;
  }
  let chosen = results.find((s) => s.schemeCode === chosenCode) ?? null;
  if (!chosen && chosenCode) chosen = (await searchHufSchemes(chosenCode).catch(() => [])).find((s) => s.schemeCode === chosenCode) ?? null;
  const href = (change: Record<string, string>) => `/onboarding/hufs/${id}/invest?${new URLSearchParams({ q, ...(chosen && { scheme: chosen.schemeCode }), tab, ...change }).toString()}`;
  const folios = chosen ? view.folios.filter((f) => f.schemeCode === chosen!.schemeCode).map((f) => f.folio) : [];

  return (
    <>
      <Link href={`/onboarding/hufs/${id}/investments`} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-3.5" />
        Investments of {huf.hufName}
      </Link>
      <PageHeader
        title="Invest"
        description={`For ${huf.hufName} (${huf.clientCode})${view.live ? ', on NSE’s live account' : ''}. Every order and SIP needs the karta’s OTP; money comes only from the HUF’s own bank account.`}
      />

      {view.block ? (
        <p className="rounded-md border border-warn/25 bg-warn-soft px-4 py-2.5 text-[13px] text-warn">Can&apos;t invest yet: {view.block}</p>
      ) : (
        <div className="grid max-w-4xl gap-4">
          <Card>
            <CardHeader title="1. Scheme" subtitle={chosen ? chosen.name : 'Search NSE’s scheme master by name, code or ISIN'} />
            <CardBody>
              <form method="get" action={`/onboarding/hufs/${id}/invest`} className="flex gap-2">
                <input type="hidden" name="tab" value={tab} />
                <span className="relative flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
                  <input
                    name="q"
                    defaultValue={q}
                    minLength={3}
                    maxLength={80}
                    placeholder="e.g. nippon nifty 50, parag parikh flexi"
                    className="h-9 w-full rounded-md border border-line-strong bg-surface pr-3 pl-9 text-[13.5px] text-ink focus:border-brand focus:ring-3 focus:ring-brand/12 focus:outline-none"
                  />
                </span>
                <button type="submit" className="h-9 rounded-md border border-line-strong bg-surface px-4 text-[13.5px] font-medium text-ink hover:bg-surface-sunken">
                  Search
                </button>
              </form>
              {searchError ? <p className="mt-3 text-[13px] text-danger">{searchError}</p> : null}
              {q.length >= 3 && !searchError ? (
                results.length ? (
                  <ul className="mt-3 max-h-80 divide-y divide-line overflow-y-auto rounded-lg border border-line">
                    {results.map((s) => (
                      <li key={s.schemeCode}>
                        <Link
                          href={href({ scheme: s.schemeCode })}
                          className={cn('flex items-center justify-between gap-3 px-3 py-2 text-[13px] hover:bg-surface-sunken', chosen?.schemeCode === s.schemeCode && 'bg-brand-soft')}
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-ink">{s.name}</span>
                            <span className="tabular text-[12px] text-ink-muted">
                              {s.schemeCode} · {s.type} · min ₹{s.minFresh ?? '—'}{s.sipMonthly ? ` · SIP from ₹${s.sipMonthly.minAmount ?? '—'}` : ''}
                            </span>
                          </span>
                          <span className="tabular shrink-0 text-[12px] text-ink-soft">{s.nav ? `NAV ${s.nav}` : ''}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-[13px] text-ink-muted">No scheme open for purchase matches “{q}”.</p>
                )
              ) : null}
            </CardBody>
          </Card>

          {chosen ? (
            <Card>
              <CardHeader title="2. How" subtitle={`${chosen.name} · NAV ${chosen.nav ?? '—'}${chosen.navDate ? ` on ${chosen.navDate}` : ''}`} />
              <CardBody className="space-y-4">
                <nav className="flex gap-2">
                  {(['lumpsum', 'sip'] as const).map((t) => (
                    <Link
                      key={t}
                      href={href({ tab: t })}
                      aria-current={tab === t ? 'page' : undefined}
                      className={cn(
                        'rounded-full border px-3.5 py-1.5 text-[13px] font-medium',
                        tab === t ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line-strong text-ink-soft hover:bg-surface-sunken',
                      )}
                    >
                      {t === 'lumpsum' ? 'Lumpsum' : 'Monthly SIP'}
                    </Link>
                  ))}
                </nav>
                {tab === 'lumpsum' ? (
                  <PurchaseForm hufId={id} scheme={chosen} folios={folios} live={view.live} />
                ) : (
                  <SipForm hufId={id} scheme={chosen} mandates={view.approvedMandates} live={view.live} />
                )}
              </CardBody>
            </Card>
          ) : null}

          {tab === 'sip' ? (
            <Card>
              <CardHeader
                title="Mandate"
                subtitle={view.approvedMandates.length ? `${view.approvedMandates.length} approved. Register another only if you need a higher limit.` : 'A SIP needs an eNACH mandate on the HUF’s account, approved by the karta with their bank.'}
              />
              <CardBody>
                <MandateForm hufId={id} />
                <p className="mt-3 text-[12px] text-ink-muted">
                  Once the karta approves it, refresh the HUF&apos;s investments: it then shows here as approved. Some banks don&apos;t support eNACH (e.g. Jio Payments Bank, Nainital Bank).
                </p>
              </CardBody>
            </Card>
          ) : null}
        </div>
      )}
    </>
  );
}

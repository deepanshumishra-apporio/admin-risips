import { ArrowLeft, Plus, Repeat } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { SectionTabs } from '@/components/ui/section-tabs';
import { StatStrip } from '@/components/ui/stat-strip';
import { Table, Td } from '@/components/ui/table';
import { OrdersTable } from '@/features/hufs/components/huf-record';
import { fundsOf, inr, planTone, sentence, unitsText } from '@/features/hufs/portfolio';
import { ApiError } from '@/lib/api/errors';
import { getHuf, getHufInvestments, getHufScheme } from '@/lib/api/hufs';
import { hasPermission } from '@/lib/auth/session';
import type { HufDetail, HufInvestmentsView, HufScheme } from '@/types/admin-api.types';

export const metadata: Metadata = { title: 'Mutual fund · RiSips Admin' };

type FundPageProps = { params: Promise<{ id: string; code: string }> };

function Fact({ label, value }: { label: string; value: React.ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <dt className="text-[11.5px] text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-[13px] font-medium break-words text-ink">{value ?? '—'}</dd>
    </div>
  );
}

const sameFund = (a: string, b: string) => a.replace(/[^A-Z0-9]/g, '').includes(b.replace(/[^A-Z0-9]/g, '').slice(0, 24));

/**
 * One mutual fund the HUF holds or has ordered: its position across folios, every transaction in it, its SIPs,
 * and what NSE's scheme master says about the fund.
 */
export default async function HufFundPage({ params }: FundPageProps): Promise<React.JSX.Element> {
  const { id, code: rawCode } = await params;
  const code = decodeURIComponent(rawCode).toUpperCase();
  if (!(await hasPermission('hufs.manage'))) {
    return (
      <>
        <PageHeader title="Mutual fund" />
        <NoAccess what="HUF onboarding" />
      </>
    );
  }
  let huf: HufDetail;
  let view: HufInvestmentsView;
  try {
    [huf, view] = await Promise.all([getHuf(id), getHufInvestments(id)]);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }
  const scheme: HufScheme | null = await getHufScheme(code).catch(() => null);
  const inv = view.investments;
  const fund = inv ? fundsOf(inv).find((f) => f.schemeCode === code) ?? null : null;
  if (!fund && !scheme) notFound();
  const name = scheme?.name ?? fund?.schemeName ?? code;
  const orders = inv?.orders.filter((o) => o.schemeCode === code) ?? [];
  const allotments = inv?.allotments.filter((a) => a.schemeCode === code) ?? [];
  const redemptions = inv?.redemptions.filter((r) => r.schemeCode === code) ?? [];
  const folios = inv?.holdings.filter((h) => h.schemeCode === code) ?? [];
  // NSE's SIP report names the scheme but gives no scheme code.
  const sips = inv?.sips.filter((s) => sameFund(s.schemeName, name) || sameFund(name, s.schemeName)) ?? [];
  const canInvest = !view.block && scheme?.purchaseAllowed !== false;
  const nav = fund?.nav ?? scheme?.nav ?? null;
  const navDate = fund?.navDate ?? scheme?.navDate ?? null;

  return (
    <>
      <Link href={`/onboarding/hufs/${id}?tab=portfolio`} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-3.5" />
        {huf.hufName} · Portfolio
      </Link>
      <PageHeader
        title={name}
        description={[scheme?.amcName, code, scheme?.isin].filter(Boolean).join(' · ')}
        actions={
          <>
            {scheme?.type ? <Badge tone="brand">{sentence(scheme.type)}</Badge> : null}
            {scheme?.rta ? <Badge tone="neutral">{scheme.rta === 'KARVY' ? 'KFin' : scheme.rta}</Badge> : null}
            {canInvest ? (
              <>
                <Link
                  href={`/onboarding/hufs/${id}/invest?${new URLSearchParams({ scheme: code, tab: 'lumpsum', q: code }).toString()}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-[13px] font-semibold text-white hover:bg-brand-strong"
                >
                  <Plus className="size-3.5" />
                  {fund?.units ? 'Buy more' : 'Buy'}
                </Link>
                {scheme?.sipMonthly ? (
                  <Link
                    href={`/onboarding/hufs/${id}/invest?${new URLSearchParams({ scheme: code, tab: 'sip', q: code }).toString()}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 text-[13px] font-medium text-ink hover:bg-surface-sunken"
                  >
                    <Repeat className="size-3.5" />
                    Start SIP
                  </Link>
                ) : null}
              </>
            ) : null}
          </>
        }
      />

      {view.block ? <p className="mb-4 rounded-md border border-warn/25 bg-warn-soft px-4 py-2.5 text-[13px] text-warn">Can&apos;t invest yet: {view.block}</p> : null}

      <StatStrip
        className="mb-5"
        items={[
          { label: 'Current value', value: inr(fund?.value, 2) },
          { label: 'Invested', value: inr(fund?.invested, 2) },
          {
            label: 'Gain',
            value: fund?.gain === null || fund?.gain === undefined ? '—' : inr(fund.gain, 2),
            ...(fund?.gainPercent !== null && fund?.gainPercent !== undefined ? { delta: fund.gainPercent } : {}),
          },
          { label: 'Units', value: fund?.units ? unitsText(fund.units) : '—' },
          { label: 'NAV', value: nav ? `₹${nav.toFixed(4)}` : '—', ...(navDate ? { caption: `on ${navDate}` } : {}) },
        ]}
      />

      <SectionTabs
        tabs={[
          {
            label: 'Holding',
            ...(folios.length ? { count: folios.length } : {}),
            content: (
              <Card>
                <CardHeader title="By folio" subtitle="Units allotted less redeemed, valued at the latest NAV" />
                {folios.length ? (
                  <Table headers={['Folio', 'Units', 'Invested', 'NAV', 'Value', 'Gain']}>
                    {folios.map((h) => (
                      <tr key={h.folio ?? 'none'}>
                        <Td className="tabular font-medium text-ink">{h.folio ?? '—'}</Td>
                        <Td className="tabular">{unitsText(h.units)}</Td>
                        <Td className="tabular">{inr(h.invested, 2)}</Td>
                        <Td className="tabular">{h.nav ? h.nav.toFixed(4) : '—'}</Td>
                        <Td className="tabular font-medium text-ink">{inr(h.value, 2)}</Td>
                        <Td className="tabular">{h.value === null ? '—' : inr(h.value - h.invested, 2)}</Td>
                      </tr>
                    ))}
                  </Table>
                ) : (
                  <CardBody>
                    <p className="text-[13px] text-ink-muted">No units in this fund yet.{orders.length ? ' See its orders under Transactions.' : ''}</p>
                  </CardBody>
                )}
              </Card>
            ),
          },
          {
            label: 'Transactions',
            ...(orders.length ? { count: orders.length } : {}),
            content: (
              <div className="space-y-4">
                <Card>
                  <CardHeader title="Orders" subtitle="As NSE has them, newest first" />
                  {orders.length ? <OrdersTable hufId={id} orders={orders} linkFunds={false} /> : <CardBody><p className="text-[13px] text-ink-muted">No orders in this fund.</p></CardBody>}
                </Card>
                {allotments.length || redemptions.length ? (
                  <Card>
                    <CardHeader title="Allotments and redemptions" subtitle="Units the registrar allotted or took out, at the NAV of the day" />
                    <Table headers={['Date', 'Order', 'Folio', 'Type', 'Units', 'NAV', 'Amount']}>
                      {[
                        ...allotments.map((a) => ({ ...a, kind: 'Allotted', nav: a.nav })),
                        ...redemptions.map((r) => ({ ...r, kind: 'Redeemed', nav: null as number | null })),
                      ]
                        .sort((a, b) => String(b.date).localeCompare(String(a.date)))
                        .map((t) => (
                          <tr key={`${t.kind}-${t.orderId}`}>
                            <Td className="whitespace-nowrap">{t.date ?? '—'}</Td>
                            <Td className="tabular">{t.orderId}</Td>
                            <Td className="tabular">{t.folio ?? '—'}</Td>
                            <Td>
                              <Badge tone={t.kind === 'Allotted' ? 'success' : 'neutral'}>{t.kind}</Badge>
                            </Td>
                            <Td className="tabular">{unitsText(t.units)}</Td>
                            <Td className="tabular">{t.nav ? t.nav.toFixed(4) : '—'}</Td>
                            <Td className="tabular">{inr(t.amount, 2)}</Td>
                          </tr>
                        ))}
                    </Table>
                  </Card>
                ) : null}
              </div>
            ),
          },
          {
            label: 'SIPs',
            ...(sips.length ? { count: sips.length } : {}),
            content: (
              <Card>
                <CardHeader title="SIPs in this fund" />
                <CardBody>
                  {sips.length ? (
                    <ul className="space-y-3">
                      {sips.map((s) => (
                        <li key={s.registrationNo} className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                          <span>
                            <span className="font-medium text-ink">{inr(s.amount)} {s.frequency.toLowerCase()}</span>
                            <span className="text-ink-muted"> · from {s.startDate ?? '—'} · {s.installments ?? '—'} instalments · {s.registrationNo}</span>
                          </span>
                          <Badge tone={planTone(s.status)}>{sentence(s.status)}</Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[13px] text-ink-muted">No SIP in this fund.</p>
                  )}
                </CardBody>
              </Card>
            ),
          },
          {
            label: 'About the fund',
            content: scheme ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader title="The fund" subtitle="From NSE's scheme master" />
                  <CardBody>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                      <Fact label="Fund house" value={scheme.amcName} />
                      <Fact label="Category" value={sentence(scheme.type)} />
                      <Fact label="Registrar" value={scheme.rta === 'KARVY' ? 'KFin Technologies' : scheme.rta} />
                      <Fact label="ISIN" value={scheme.isin} />
                      <Fact label="NSE scheme code" value={scheme.schemeCode} />
                      <Fact label="Settlement" value={scheme.settlement} />
                      <Fact label="Exit load" value={scheme.exitLoad} />
                      <Fact label="Lock-in" value={scheme.lockInDays ? `${scheme.lockInDays} days` : 'None'} />
                      <Fact label="Open since" value={scheme.launchedOn} />
                    </dl>
                  </CardBody>
                </Card>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <Card>
                    <CardHeader title="Buying" />
                    <CardBody>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <Fact label="Open for purchase" value={scheme.purchaseAllowed ? 'Yes' : 'No'} />
                        <Fact label="Cut-off" value={scheme.cutoff || '—'} />
                        <Fact label="First purchase from" value={inr(scheme.minFresh)} />
                        <Fact label="Additional from" value={inr(scheme.minAdditional)} />
                        <Fact label="In multiples of" value={inr(scheme.multiplier)} />
                        <Fact label="Redemption" value={scheme.redemptionAllowed ? `Yes${scheme.redemptionMinAmount ? `, from ${inr(scheme.redemptionMinAmount)}` : ''}` : 'No'} />
                      </dl>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardHeader title="Monthly SIP" />
                    <CardBody>
                      {scheme.sipMonthly ? (
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                          <Fact label="From" value={inr(scheme.sipMonthly.minAmount)} />
                          <Fact label="Instalments" value={`${scheme.sipMonthly.minInstallments ?? 1} to ${scheme.sipMonthly.maxInstallments ?? '—'}`} />
                          <Fact label="On days" value={scheme.sipMonthly.dates.join(', ') || 'Any'} />
                          <Fact label="First instalment" value={`At least ${Math.max(scheme.sipMonthly.minGapDays ?? 0, 7)} days out`} />
                        </dl>
                      ) : (
                        <p className="text-[13px] text-ink-muted">This fund doesn&apos;t take monthly SIPs.</p>
                      )}
                    </CardBody>
                  </Card>
                </div>
              </div>
            ) : (
              <Card>
                <CardBody>
                  <p className="text-[13px] text-ink-muted">NSE&apos;s scheme master couldn&apos;t be read just now.</p>
                </CardBody>
              </Card>
            ),
          },
        ]}
      />
    </>
  );
}

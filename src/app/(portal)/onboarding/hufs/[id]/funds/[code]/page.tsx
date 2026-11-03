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
import { cutoffText, fundName, fundTags, navDateLong } from '@/features/hufs/components/fund-explorer';
import { pct, ReturnsGrid } from '@/features/hufs/components/fund-bits';
import { OrdersTable } from '@/features/hufs/components/huf-record';
import { NavChart } from '@/features/hufs/components/nav-chart';
import { fundsOf, inr, planTone, sentence, unitsText } from '@/features/hufs/portfolio';
import { ApiError } from '@/lib/api/errors';
import { getHuf, getHufInvestments, getHufScheme, getHufSchemeHistory } from '@/lib/api/hufs';
import { hasPermission } from '@/lib/auth/session';
import type { HufDetail, HufInvestmentsView, HufNavHistory, HufScheme } from '@/types/admin-api.types';

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
/** "30/10/2026" or "2026-10-30" -> 2026-10-30. */
const isoOf = (v: string | null) => {
  const m = String(v ?? '').match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : /^\d{4}-\d{2}-\d{2}/.test(String(v)) ? String(v).slice(0, 10) : null;
};
const longDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Where today's NAV sits between the year's low and high. */
function YearRange({ history, nav }: { history: HufNavHistory; nav: number | null }): React.JSX.Element | null {
  const { high52: hi, low52: lo } = history.returns;
  if (!hi || !lo || !nav) return null;
  const at = hi.nav === lo.nav ? 50 : Math.min(100, Math.max(0, ((nav - lo.nav) / (hi.nav - lo.nav)) * 100));
  return (
    <div>
      <div className="mb-2 flex justify-between text-[12px] text-ink-muted">
        <span>52-week low</span>
        <span>52-week high</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-gradient-to-r from-danger/40 via-warn/40 to-success/50">
        <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-ink shadow" style={{ left: `${at}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-[12.5px]">
        <span>
          <span className="tabular font-semibold text-ink">₹{lo.nav.toFixed(2)}</span> <span className="text-ink-muted">{longDate(lo.date)}</span>
        </span>
        <span className="text-right">
          <span className="tabular font-semibold text-ink">₹{hi.nav.toFixed(2)}</span> <span className="text-ink-muted">{longDate(hi.date)}</span>
        </span>
      </div>
    </div>
  );
}

/**
 * One mutual fund for a HUF: its NAV chart and returns, everything NSE's scheme master and AMFI say about it, and
 * the HUF's own position, transactions and SIPs in it.
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
  const [scheme, history] = await Promise.all([
    getHufScheme(code).catch((): HufScheme | null => null),
    getHufSchemeHistory(code).catch((): HufNavHistory | null => null),
  ]);
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
  const nav = scheme?.nav ?? fund?.nav ?? null;
  const navDate = scheme?.navDate ?? fund?.navDate ?? null;
  const period = (key: string) => history?.returns.periods.find((p) => p.key === key)?.percent ?? null;
  const markers = allotments.flatMap((a) => {
    const date = isoOf(a.date);
    return date ? [{ date, label: `Bought ${inr(a.amount, 2)}, ${unitsText(a.units)} units` }] : [];
  });
  const owns = Boolean(fund && (fund.units > 0 || fund.orders > 0));
  const investHref = (type: 'lumpsum' | 'sip') => `/onboarding/hufs/${id}/invest/${encodeURIComponent(code)}${type === 'sip' ? '?type=sip' : ''}`;

  const overview = (
    <div className="space-y-4">
      <Card>
        <CardHeader title="NAV" subtitle="Daily NAV as AMFI publishes it. Hover the chart to read any day." />
        <CardBody>
          {history?.points.length ? (
            <NavChart points={history.points} markers={markers} />
          ) : (
            <p className="py-8 text-center text-[13px] text-ink-muted">{history?.error ?? 'NAV history couldn’t be read just now.'}</p>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader
          title="Returns"
          subtitle={`Up to a year: the change in NAV. Beyond: compounded a year.${history?.returns.sinceLaunch ? ` Since ${longDate(history.returns.sinceLaunch.from)}: ${pct(history.returns.sinceLaunch.percent)}${history.returns.sinceLaunch.annualised ? ' a year' : ''}.` : ''}`}
        />
        <CardBody className="space-y-5">
          <ReturnsGrid history={history} />
          {history ? <YearRange history={history} nav={nav} /> : null}
          <p className="text-[11.5px] text-ink-muted">Past returns don&apos;t promise future ones. IDCW options pay out, so their NAV understates what the fund returned.</p>
        </CardBody>
      </Card>
      {scheme ? (
        <>
          <Card>
            <CardHeader title="About the fund" subtitle="From NSE's scheme master and AMFI" />
            <CardBody>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                <Fact label="Fund house" value={scheme.amcName} />
                <Fact label="Asset class" value={scheme.assetClass} />
                <Fact label="Category" value={scheme.category ?? sentence(scheme.type)} />
                <Fact label="Plan" value={scheme.planName} />
                <Fact label="Option" value={scheme.option === 'IDCW' ? 'IDCW (pays out)' : scheme.option} />
                <Fact label="Structure" value={scheme.structure ?? (scheme.openEnded === false ? 'Close ended' : 'Open ended')} />
                <Fact label="Registrar" value={scheme.rta === 'KARVY' ? 'KFin Technologies' : scheme.rta} />
                <Fact label="ISIN" value={scheme.isin} />
                <Fact label="NSE scheme code" value={scheme.schemeCode} />
                <Fact label="AMFI code" value={scheme.amfiCode} />
                <Fact label="Settlement" value={scheme.settlement} />
                <Fact label="Exit load" value={scheme.exitLoad} />
                <Fact label="Lock-in" value={scheme.lockInDays ? `${scheme.lockInDays} days` : 'None'} />
                <Fact label="Open since" value={scheme.launchedOn ?? (history?.returns.sinceLaunch ? longDate(history.returns.sinceLaunch.from) : null)} />
              </dl>
            </CardBody>
          </Card>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader title="Buying and selling" />
              <CardBody>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Fact label="Open for purchase" value={scheme.purchaseAllowed ? 'Yes' : 'No'} />
                  <Fact label="Cut-off" value={cutoffText(scheme.cutoff) || '—'} />
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
        </>
      ) : (
        <Card>
          <CardBody>
            <p className="text-[13px] text-ink-muted">NSE&apos;s scheme master couldn&apos;t be read just now.</p>
          </CardBody>
        </Card>
      )}
    </div>
  );

  const holding = (
    <div className="space-y-4">
      <StatStrip
        items={[
          { label: 'Current value', value: inr(fund?.value, 2) },
          { label: 'Invested', value: inr(fund?.invested, 2) },
          {
            label: 'Gain',
            value: fund?.gain === null || fund?.gain === undefined ? '—' : inr(fund.gain, 2),
            ...(fund?.gainPercent !== null && fund?.gainPercent !== undefined ? { delta: fund.gainPercent } : {}),
          },
          { label: 'Units', value: fund?.units ? unitsText(fund.units) : '—' },
        ]}
      />
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
    </div>
  );

  const transactions = (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Orders" subtitle="As NSE has them, newest first" />
        {orders.length ? <OrdersTable hufId={id} orders={orders} linkFunds={false} /> : <CardBody><p className="text-[13px] text-ink-muted">No orders in this fund.</p></CardBody>}
      </Card>
      {allotments.length || redemptions.length ? (
        <Card>
          <CardHeader title="Allotments and redemptions" subtitle="Units the registrar allotted or took out, at the NAV of the day" />
          <Table headers={['Date', 'Order', 'Folio', 'Type', 'Units', 'NAV', 'Amount']}>
            {[...allotments.map((a) => ({ ...a, kind: 'Allotted', nav: a.nav })), ...redemptions.map((r) => ({ ...r, kind: 'Redeemed', nav: null as number | null }))]
              .sort((a, b) => String(isoOf(b.date)).localeCompare(String(isoOf(a.date))))
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
  );

  const sipPanel = (
    <Card>
      <CardHeader title="SIPs in this fund" />
      <CardBody>
        {sips.length ? (
          <ul className="space-y-3">
            {sips.map((s) => (
              <li key={s.registrationNo} className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                <span>
                  <span className="font-medium text-ink">
                    {inr(s.amount)} {s.frequency.toLowerCase()}
                  </span>
                  <span className="text-ink-muted"> · from {s.startDate ?? '—'} · {s.installments ?? '—'} instalments · {s.registrationNo}</span>
                </span>
                <Badge tone={planTone(s.status)}>{sentence(s.status)}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-ink-muted">
            No SIP in this fund.{' '}
            {canInvest && scheme?.sipMonthly ? (
              <Link href={investHref('sip')} className="font-semibold text-brand hover:text-brand-deep">
                Start one
              </Link>
            ) : null}
          </p>
        )}
      </CardBody>
    </Card>
  );

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-medium text-ink-muted">
        <Link href={owns ? `/onboarding/hufs/${id}?tab=portfolio` : `/onboarding/hufs/${id}/funds`} className="inline-flex items-center gap-1.5 hover:text-ink">
          <ArrowLeft className="size-3.5" />
          {owns ? `${huf.hufName} · Portfolio` : 'All mutual funds'}
        </Link>
        {owns ? (
          <Link href={`/onboarding/hufs/${id}/funds`} className="hover:text-ink">
            All mutual funds
          </Link>
        ) : null}
      </div>
      <PageHeader
        title={scheme ? fundName(scheme) : name}
        description={[scheme?.amcName, scheme ? fundTags(scheme) : null, code].filter(Boolean).join(' · ')}
        actions={
          <>
            {scheme?.assetClass ? <Badge tone="brand">{scheme.assetClass}</Badge> : null}
            {scheme?.rta ? <Badge tone="neutral">{scheme.rta === 'KARVY' ? 'KFin' : scheme.rta}</Badge> : null}
            {canInvest ? (
              <>
                <Link href={investHref('lumpsum')} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-[13px] font-semibold text-white hover:bg-brand-strong">
                  <Plus className="size-3.5" />
                  {fund?.units ? 'Buy more' : 'Buy'}
                </Link>
                {scheme?.sipMonthly ? (
                  <Link
                    href={investHref('sip')}
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
          { label: 'NAV', value: nav ? `₹${nav.toLocaleString('en-IN', { maximumFractionDigits: 4 })}` : '—', ...(navDate ? { caption: `on ${navDateLong(navDate)}` } : {}) },
          { label: '1 year', value: pct(period('1Y')) },
          { label: '3 years, a year', value: pct(period('3Y')) },
          { label: '5 years, a year', value: pct(period('5Y')) },
          ...(fund?.units ? [{ label: "The HUF's holding", value: inr(fund.value ?? fund.invested), ...(fund.gainPercent !== null ? { delta: fund.gainPercent } : {}) }] : []),
        ]}
      />

      <SectionTabs
        tabs={[
          { label: 'Overview', content: overview },
          ...(owns
            ? [
                { label: "The HUF's holding", ...(folios.length ? { count: folios.length } : {}), content: holding },
                { label: 'Transactions', ...(orders.length ? { count: orders.length } : {}), content: transactions },
              ]
            : []),
          { label: 'SIPs', ...(sips.length ? { count: sips.length } : {}), content: sipPanel },
        ]}
      />
    </>
  );
}

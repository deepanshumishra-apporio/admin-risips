import { ArrowLeft, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { StatStrip } from '@/components/ui/stat-strip';
import { Table, Td } from '@/components/ui/table';
import { CopyLink, RefreshInvestments, RequestLink } from '@/features/hufs/components/invest-forms';
import { ApiError } from '@/lib/api/errors';
import { getHuf, getHufInvestments } from '@/lib/api/hufs';
import { hasPermission } from '@/lib/auth/session';
import type { HufDetail, HufInvestmentsView } from '@/types/admin-api.types';
import { formatDateTime, timeAgo } from '@/utils/format';

export const metadata: Metadata = { title: 'HUF investments · RiSips Admin' };

const inr = (n: number | null | undefined, digits = 0) =>
  n === null || n === undefined ? '—' : `₹${n.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

function orderTone(status: string, remark: string): BadgeTone {
  if (/ALLOTMENT DONE|UNITS TRANSFERRED/.test(remark)) return 'success';
  if (/INVALID|FAIL|REJECT/.test(`${status} ${remark}`)) return 'danger';
  return 'warn';
}

const statusTone = (s: string): BadgeTone => (/APPROVED|ACTIVE|LIVE/.test(s) ? 'success' : /REJECT|CXL|CANCEL|FAIL/.test(s) ? 'danger' : 'warn');

const RequestKind: Record<string, string> = { PURCHASE: 'Lumpsum purchase', MANDATE: 'eNACH mandate', SIP: 'Monthly SIP' };

export default async function HufInvestmentsPage({ params }: { params: Promise<{ id: string }> }): Promise<React.JSX.Element> {
  const { id } = await params;
  if (!(await hasPermission('hufs.manage'))) {
    return (
      <>
        <PageHeader title="HUF investments" />
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
  const inv = view.investments;
  const gain = inv && inv.totals.value !== null ? inv.totals.value - inv.totals.invested : null;

  return (
    <>
      <Link href={`/onboarding/hufs/${id}`} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-3.5" />
        {huf.hufName}
      </Link>
      <PageHeader
        title="Investments"
        description={`${huf.hufName} · client code ${huf.clientCode} · read from NSE${view.readAt ? ` ${timeAgo(view.readAt)}` : ': not yet'}`}
        actions={
          view.block ? undefined : (
            <Link
              href={`/onboarding/hufs/${id}/invest`}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-[14px] font-semibold text-white transition-colors hover:bg-brand-strong"
            >
              <Plus className="size-4" />
              Invest
            </Link>
          )
        }
      />

      {view.block ? (
        <p className="mb-4 rounded-md border border-warn/25 bg-warn-soft px-4 py-2.5 text-[13px] text-warn">Can&apos;t invest yet: {view.block}</p>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center gap-3 text-[13px] text-ink-muted">
        <RefreshInvestments hufId={id} />
        <span>Orders, allotments, SIPs and mandates as NSE has them. Read again once a day on its own.</span>
      </div>

      {!inv ? (
        <Card>
          <CardBody>
            <p className="text-[13.5px] text-ink-muted">Nothing read from NSE yet. Press Refresh from NSE.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          <StatStrip
            items={[
              { label: 'Current value', value: inr(inv.totals.value), hint: 'Units held × the latest NAV in NSE’s scheme master' },
              { label: 'Invested', value: inr(inv.totals.invested) },
              { label: 'Gain', value: gain === null ? '—' : inr(gain) },
              { label: 'Active SIPs', value: inv.totals.activeSips ? `${inv.totals.activeSips} · ${inr(inv.totals.sipMonthly)}/mo` : '—' },
            ]}
          />

          <Card>
            <CardHeader title="Holdings" subtitle="Allotted units less redemptions, per scheme and folio" />
            {inv.holdings.length ? (
              <Table headers={['Scheme', 'Folio', 'Units', 'Invested', 'NAV', 'Value']}>
                {inv.holdings.map((h) => (
                  <tr key={`${h.schemeCode}-${h.folio}`}>
                    <Td className="font-medium text-ink">{h.schemeName}</Td>
                    <Td className="tabular">{h.folio ?? '—'}</Td>
                    <Td className="tabular">{h.units.toFixed(4)}</Td>
                    <Td className="tabular">{inr(h.invested, 2)}</Td>
                    <Td className="tabular">{h.nav ? `${h.nav.toFixed(4)}${h.navDate ? ` (${h.navDate})` : ''}` : '—'}</Td>
                    <Td className="tabular font-medium text-ink">{inr(h.value, 2)}</Td>
                  </tr>
                ))}
              </Table>
            ) : (
              <CardBody>
                <p className="text-[13px] text-ink-muted">No units allotted yet.</p>
              </CardBody>
            )}
          </Card>

          <Card>
            <CardHeader title="Orders" subtitle="Every purchase and redemption on NSE, newest first" />
            {inv.orders.length ? (
              <Table headers={['Order', 'Date', 'Scheme', 'Type', 'Amount', 'Folio', 'Status']}>
                {inv.orders.map((o) => (
                  <tr key={o.orderId}>
                    <Td className="tabular">{o.orderId}</Td>
                    <Td className="whitespace-nowrap">{o.date ?? '—'}</Td>
                    <Td>{o.schemeName}</Td>
                    <Td>{o.type === 'REDEMPTION' ? 'Redemption' : o.orderType === 'XSP' || o.sipRegistrationNo ? 'SIP instalment' : 'Purchase'}</Td>
                    <Td className="tabular">{inr(o.amount)}</Td>
                    <Td className="tabular">{o.folio ?? '—'}</Td>
                    <Td>
                      <Badge tone={orderTone(o.status, o.remark)}>{o.remark || o.status}</Badge>
                    </Td>
                  </tr>
                ))}
              </Table>
            ) : (
              <CardBody>
                <p className="text-[13px] text-ink-muted">No orders on NSE yet.</p>
              </CardBody>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader title="SIPs" />
              <CardBody>
                {inv.sips.length ? (
                  <ul className="space-y-3">
                    {inv.sips.map((s) => (
                      <li key={s.registrationNo} className="text-[13px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-ink">{s.schemeName}</span>
                          <Badge tone={statusTone(s.status)}>{s.status}</Badge>
                        </div>
                        <p className="text-ink-muted">
                          {inr(s.amount)} {s.frequency.toLowerCase()} from {s.startDate ?? '—'} · {s.installments ?? '—'} instalments · {s.registrationNo}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-ink-muted">No SIPs.</p>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Mandates" />
              <CardBody>
                {inv.mandates.length ? (
                  <ul className="space-y-3">
                    {inv.mandates.map((m) => (
                      <li key={m.mandateId} className="text-[13px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="tabular font-medium text-ink">{m.mandateId}</span>
                          <Badge tone={statusTone(m.status)}>{m.status}</Badge>
                        </div>
                        <p className="text-ink-muted">
                          Up to {inr(m.amount)} a debit{m.bankName ? ` · ${m.bankName}` : ''}{m.endDate ? ` · until ${m.endDate}` : ''}{m.remark ? ` · ${m.remark}` : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-ink-muted">No mandates.</p>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {view.requests.length ? (
        <Card className="mt-4">
          <CardHeader title="Started from here" subtitle="NSE sends the karta each link too; copy it to send it yourself." />
          <CardBody>
            <ul className="space-y-4">
              {view.requests.map((q) => (
                <li key={q.id} className="space-y-1.5 border-b border-line pb-4 text-[13px] last:border-b-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-ink">
                      {RequestKind[q.kind]} · {inr(q.amount)}
                      {q.schemeName ? ` · ${q.schemeName}` : ''}
                    </span>
                    <Badge tone={q.ok ? 'success' : 'danger'}>{q.ok ? `NSE ${q.nseId}` : 'Refused by NSE'}</Badge>
                  </div>
                  <p className="text-ink-muted">
                    {formatDateTime(q.at)}
                    {q.by ? ` · ${q.by}` : ''}
                    {q.remark ? ` · ${q.remark}` : ''}
                  </p>
                  {q.ok ? (
                    q.link ? (
                      <CopyLink url={q.link} />
                    ) : (
                      <span className="flex flex-wrap items-center gap-2 text-ink-muted">
                        No link from NSE yet{q.linkError ? `: ${q.linkError}` : ''}. <RequestLink hufId={id} requestId={q.id} />
                      </span>
                    )
                  ) : null}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}
    </>
  );
}

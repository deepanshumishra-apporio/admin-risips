import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { MetricSection } from '@/features/dashboard/components/metric-section';
import { SipActions } from '@/features/sips/components/sip-actions';
import { frequencyLabel, SipStatusBadge } from '@/features/sips/components/sip-table';
import { getSip } from '@/lib/api/sips';
import { ApiError } from '@/lib/api/errors';
import { hasPermission } from '@/lib/auth/session';
import type { SipDetail, SipInstalmentStatus } from '@/types/admin-api.types';
import { formatDate, formatInrString } from '@/utils/format';

export const metadata: Metadata = { title: 'SIP · RiSips Admin' };

type Props = { params: Promise<{ id: string }> };

const Uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const date = (d: string | null | undefined): string => (d ? formatDate(d) : '—');

const InstalmentBadge: Record<SipInstalmentStatus, { label: string; tone: BadgeTone }> = {
  UPCOMING: { label: 'Upcoming', tone: 'brand' },
  PENDING: { label: 'Processing', tone: 'warn' },
  SUCCESS: { label: 'Success', tone: 'success' },
  FAILED: { label: 'Failed', tone: 'danger' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
  SKIPPED: { label: 'Skipped', tone: 'neutral' },
};

function Rows({ rows }: { rows: [string, React.ReactNode][] }): React.JSX.Element {
  return (
    <dl className="grid grid-cols-[minmax(110px,40%)_1fr] gap-x-4 gap-y-2.5 px-4 py-4 text-[13px]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-ink-muted">{label}</dt>
          <dd className="min-w-0 break-words text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function SipDetailPage({ params }: Props): Promise<React.JSX.Element> {
  if (!(await hasPermission('transactions.read'))) return <NoAccess what="SIPs" />;
  const { id } = await params;
  if (!Uuid.test(id)) notFound();
  let sip: SipDetail;
  try {
    sip = await getSip(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const status = SipStatusBadge[sip.status];
  const done = sip.instalments.filter((i) => i.status === 'SUCCESS').length;
  const progress = sip.installmentsTotal ? Math.min(100, (done / sip.installmentsTotal) * 100) : null;
  const canAct = await hasPermission('sips.manage');

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-3 text-[13px] text-ink-muted">
        <Link href="/orders/sips" className="text-brand hover:underline">
          Orders &amp; SIPs
        </Link>{' '}
        /{' '}
        <Link href="/orders/sips" className="text-brand hover:underline">
          Active SIPs
        </Link>{' '}
        / <span className="text-ink-soft">{sip.reference}</span>
      </nav>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-[20px] leading-tight font-semibold tracking-[-0.015em] text-ink">
            <span className="break-all">SIP {sip.reference}</span>
            <Badge tone={status.tone}>{status.label}</Badge>
          </h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            {sip.scheme} ·{' '}
            {sip.investor ? (
              <Link href={`/investors/${sip.investor.id}`} className="text-brand hover:underline">
                {sip.investor.name || 'No name yet'}
              </Link>
            ) : (
              'Unknown investor'
            )}
          </p>
        </div>
        <SipActions sip={sip} canAct={canAct} />
      </div>

      <div className="space-y-5">
        <MetricSection
          columns={4}
          metrics={[
            { label: 'SIP amount', value: formatInrString(sip.amount, { compact: false }) },
            { label: 'Frequency', value: frequencyLabel(sip.frequency) },
            { label: 'Next instalment', value: date(sip.nextInstallmentDate), caption: sip.pause ? `Paused until ${date(sip.pause.to)}` : undefined },
            { label: 'Instalments', value: `${done} / ${sip.installmentsTotal ?? '∞'}`, caption: sip.installmentsTotal ? undefined : 'Runs until cancelled' },
          ]}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardHeader title="SIP details" />
              <Rows
                rows={[
                  ['Investor', sip.investor?.name || '—'],
                  ['PAN', sip.investor?.pan ?? '—'],
                  ['Folio', sip.folio ?? '—'],
                  ['Scheme', sip.scheme],
                  ['AMC', sip.amc ?? '—'],
                  ['Start date', date(sip.startDate)],
                  ['End date', sip.endDate ? date(sip.endDate) : sip.installmentsTotal ? '—' : 'Until cancelled'],
                  ['SIP date', sip.sipDay ? `${sip.sipDay} of each ${sip.frequency === 'monthly' ? 'month' : 'period'}` : /daily/.test(sip.frequency) ? frequencyLabel(sip.frequency) : '—'],
                  ['Next debit date', date(sip.nextInstallmentDate)],
                  ...(sip.pause ? ([['Paused', `${date(sip.pause.from)} to ${date(sip.pause.to)}`]] as [string, string][]) : []),
                  ...(sip.cancelledAt ? ([['Cancelled on', date(sip.cancelledAt)]] as [string, string][]) : []),
                  ...(sip.cancellationReason ? ([['Reason', sip.cancellationReason]] as [string, string][]) : []),
                  // Modify registers a new SIP and cancels the old one: link both ways
                  ...(sip.replacedById
                    ? ([['Replaced by', <Link key="replaced-by" href={`/orders/sips/${sip.replacedById}`} className="text-brand hover:underline">The new SIP →</Link>]] as [string, React.ReactNode][])
                    : []),
                  ...(sip.replacesId
                    ? ([['Replaces', <Link key="replaces" href={`/orders/sips/${sip.replacesId}`} className="text-brand hover:underline">The earlier SIP it replaced →</Link>]] as [string, React.ReactNode][])
                    : []),
                ]}
              />
            </Card>

            <Card>
              <CardHeader title="Mandate" />
              {sip.mandate ? (
                <>
                  <Rows
                    rows={[
                      ['Mandate ID', sip.mandate.id],
                      ['Type', sip.mandate.type ?? '—'],
                      ['Bank account', sip.bank ? `${sip.bank.bankName ?? 'Bank'} · ${sip.bank.accountMasked}` : '—'],
                      ['Max amount', formatInrString(sip.mandate.maxAmount, { compact: false })],
                      ['Valid until', date(sip.mandate.validUntil)],
                    ]}
                  />
                  <div className="px-4 pb-4">
                    <Badge tone={/approved|active/i.test(sip.mandate.status ?? '') ? 'success' : 'warn'}>
                      {sip.mandate.status ? frequencyLabel(sip.mandate.status.toLowerCase()) : 'Unknown'}
                    </Badge>
                  </div>
                </>
              ) : (
                <p className="px-4 py-4 text-[13px] text-ink-muted">No AutoPay mandate on record for this investor.</p>
              )}
            </Card>
          </div>

          <Card>
            <CardHeader title="Instalment history" />
            <div className="px-4 pt-3">
              <div className="flex items-center justify-between text-[12.5px] text-ink-soft">
                <span>Progress</span>
                <span className="tabular">
                  {done} of {sip.installmentsTotal ?? '∞'} paid
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
                <div className="h-full rounded-full bg-brand" style={{ width: `${progress ?? (done ? 100 : 0)}%` }} />
              </div>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[440px] text-[13px]">
                <thead>
                  <tr className="border-y border-line bg-surface-sunken text-left text-[12px] text-ink-muted">
                    <th className="px-4 py-2 font-medium">Instalment</th>
                    <th className="px-4 py-2 font-medium">Date</th>
                    <th className="px-4 py-2 text-right font-medium">Amount</th>
                    <th className="px-4 py-2 text-right font-medium">Units</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sip.instalments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">
                        No instalments yet.
                      </td>
                    </tr>
                  ) : (
                    sip.instalments.map((i) => {
                      const badge = InstalmentBadge[i.status];
                      return (
                        <tr key={`${i.number}-${i.status}`} className="border-b border-line last:border-b-0">
                          <td className="tabular px-4 py-2.5 text-ink">#{i.number}</td>
                          <td className="px-4 py-2.5 text-ink-soft">{date(i.date)}</td>
                          <td className="tabular px-4 py-2.5 text-right text-ink">{formatInrString(i.amount, { compact: false })}</td>
                          <td className="tabular px-4 py-2.5 text-right text-ink-soft">{i.units ?? '—'}</td>
                          <td className="px-4 py-2.5" title={i.reason ?? undefined}>
                            <Badge tone={badge.tone}>{badge.label}</Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

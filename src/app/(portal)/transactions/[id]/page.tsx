import { Download } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { TransactionRetry } from '@/features/transactions/components/transaction-retry';
import { OrderStateLabel, OrderTypeLabel } from '@/features/transactions/labels';
import { ApiError } from '@/lib/api/errors';
import { getTransactionDetail } from '@/lib/api/transactions';
import { hasPermission } from '@/lib/auth/session';
import type { MonitorOrderState, TransactionDetail } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatDateTime, formatInrString } from '@/utils/format';

export const metadata: Metadata = { title: 'Transaction · RiSips Admin' };

const Uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const StateTone: Record<MonitorOrderState, BadgeTone> = {
  UNDER_REVIEW: 'warn', PENDING: 'warn', CONFIRMED: 'warn', SUBMITTED: 'brand', SUCCESSFUL: 'success', FAILED: 'danger', CANCELLED: 'neutral', REVERSED: 'danger',
};

const dash = (v: string | null | undefined): string => (v === null || v === undefined || v === '' ? '—' : v);

export default async function TransactionPage({ params }: { params: Promise<{ id: string }> }): Promise<React.JSX.Element> {
  if (!(await hasPermission('transactions.read'))) return <NoAccess what="transactions" />;
  const { id } = await params;
  if (!Uuid.test(id)) notFound();
  let d: TransactionDetail;
  try {
    d = await getTransactionDetail(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const o = d.order;
  const canAct = await hasPermission('sips.manage');
  const amount = o.processedAmount ?? o.amount ?? o.estimatedAmount ?? null;
  const rows: [string, React.ReactNode][] = [
    ['Scheme', o.scheme],
    ...(o.toScheme ? ([['Switched to', o.toScheme]] as [string, string][]) : []),
    ['Folio', dash(o.folio)],
    ['Type', OrderTypeLabel[o.type]],
    ['Amount', amount ? formatInrString(amount, { compact: false }) : o.allUnits ? 'All units' : '—'],
    ['Units', dash(o.processedUnits ?? o.units)],
    ['NAV', d.nav ? `₹${d.nav}` : '—'],
    ['Payment mode', dash(d.paymentMode)],
    ['Reference no.', <span key="ref" className="tabular break-all">{d.paymentReference ?? d.reference}</span>],
    ...(o.failureReason ? ([['Reason', <span key="why" className="text-danger">{o.failureReason}</span>]] as [string, React.ReactNode][]) : []),
  ];

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-3 text-[13px] text-ink-muted">
        <Link href="/orders/sips" className="text-brand hover:underline">Orders &amp; SIPs</Link> /{' '}
        <Link href="/transactions" className="text-brand hover:underline">Transactions</Link> / <span className="text-ink-soft">{d.reference}</span>
      </nav>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-[20px] leading-tight font-semibold tracking-[-0.015em] text-ink">
            <span className="break-all">Transaction {d.reference}</span>
            <Badge tone={StateTone[o.state]}>{OrderStateLabel[o.state]}</Badge>
          </h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            {OrderTypeLabel[o.type]} · {formatDateTime(o.placedAt)}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <a
            href={`/transactions/${o.id}/receipt`}
            className="inline-flex h-9.5 items-center gap-2 rounded-md border border-line-strong bg-surface px-4 text-[13.5px] font-medium text-ink hover:bg-surface-sunken"
          >
            <Download className="size-4" />
            Download receipt
          </a>
          <TransactionRetry detail={d} canAct={canAct} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="self-start">
          <CardHeader title="Details" />
          <dl className="grid grid-cols-[minmax(110px,35%)_1fr] gap-x-4 gap-y-2.5 px-4 py-4 text-[13px]">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-ink-muted">{label}</dt>
                <dd className="min-w-0 break-words text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Investor" />
            <div className="px-4 py-4 text-[13px]">
              <p className="text-ink">
                {o.investor.name ?? 'Unnamed investor'} · <span className="tabular text-ink-soft">{dash(o.investor.pan)}</span>
              </p>
              {o.investor.id ? (
                <Link href={`/investors/${o.investor.id}`} className="mt-1 inline-block font-medium text-brand underline-offset-2 hover:underline">
                  View investor
                </Link>
              ) : null}
            </div>
          </Card>

          <Card>
            <CardHeader title="Status timeline" />
            <ol className="px-4 py-4">
              {d.timeline.map((s, i) => (
                <li key={s.key} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < d.timeline.length - 1 ? <span className="absolute top-3.5 left-[5px] h-full w-px bg-line-strong" aria-hidden /> : null}
                  <span
                    className={cn(
                      'relative mt-1 size-[11px] shrink-0 rounded-full border-2',
                      s.tone === 'done' ? 'border-success bg-success' : s.tone === 'failed' ? 'border-danger bg-danger' : 'border-line-strong bg-surface',
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className={cn('text-[13.5px] font-semibold', s.tone === 'failed' ? 'text-danger' : s.tone === 'pending' ? 'text-ink-muted' : 'text-ink')}>{s.label}</p>
                    <p className="text-[12px] text-ink-muted">
                      {[s.at ? formatDateTime(s.at) : s.tone === 'pending' ? 'Not yet' : null, s.by].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { Badge, type BadgeTone } from '@/components/ui/badge';
import { OrderStateLabel, OrderTypeLabel } from '@/features/transactions/labels';
import type { MonitorOrderState, TransactionList } from '@/types/admin-api.types';
import { formatDateTime } from '@/utils/format';

type Row = TransactionList['items'][number];

const StateTone: Record<MonitorOrderState, BadgeTone> = {
  UNDER_REVIEW: 'warn', PENDING: 'warn', CONFIRMED: 'warn', SUBMITTED: 'brand', SUCCESSFUL: 'success', FAILED: 'danger', CANCELLED: 'neutral', REVERSED: 'danger',
};

/** Rupees when the order has an amount, else units (a redemption or switch can be by units, or all of them). */
const amountText = (o: Row): string => {
  const amount = o.amount ?? o.estimatedAmount ?? null;
  if (amount !== null && amount !== undefined) return `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  if (o.allUnits) return 'All units';
  if (o.units !== null) return `${Number(o.units).toLocaleString('en-IN', { maximumFractionDigits: 4 })} units`;
  return '—';
};

/** A row that opens the transaction's own page (click or Enter). Links inside it keep their own clicks. */
function OrderRow({ id, label, children }: { id: string; label: string; children: ReactNode }): React.JSX.Element {
  const router = useRouter();
  const go = (): void => router.push(`/transactions/${id}`);
  return (
    <tr
      tabIndex={0}
      role="link"
      aria-label={`Open ${label}`}
      onClick={go}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          go();
        }
      }}
      className="cursor-pointer border-b border-line transition-colors last:border-b-0 hover:bg-surface-sunken focus-visible:bg-brand-soft/40 focus-visible:outline-none"
    >
      {children}
    </tr>
  );
}

const head = 'px-3 py-2.5 font-medium whitespace-nowrap';
const cell = 'px-3 py-2.5 whitespace-nowrap';

/** The design's columns: ID, date and time, investor, scheme, type, amount, payment mode, status. */
export function TransactionTable({ orders }: { orders: Row[] }): React.JSX.Element {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-[13px]">
        <thead>
          <tr className="border-b border-line bg-surface-sunken text-left text-[12px] text-ink-muted">
            <th className={head}>Transaction ID</th>
            <th className={head}>Date &amp; time</th>
            <th className={head}>Investor</th>
            <th className={head}>Scheme</th>
            <th className={head}>Type</th>
            <th className={`${head} text-right`}>Amount</th>
            <th className={head}>Payment mode</th>
            <th className={head}>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-10 text-center text-ink-muted">
                No transactions match these filters.
              </td>
            </tr>
          ) : (
            orders.map((o) => {
              const name = o.investor.name ?? 'Unnamed investor';
              const ref = o.reference ?? o.id;
              return (
                <OrderRow key={o.id} id={o.id} label={`${OrderTypeLabel[o.type]} for ${name}`}>
                  <td className={`${cell} tabular`} title={ref}>
                    <Link href={`/transactions/${o.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-brand underline-offset-2 hover:underline">
                      {ref.length > 16 ? `${ref.slice(0, 14)}…` : ref}
                    </Link>
                  </td>
                  <td className={`${cell} text-ink-soft`}>{formatDateTime(o.placedAt)}</td>
                  <td className={cell}>
                    {o.investor.id ? (
                      <Link href={`/investors/${o.investor.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-brand underline-offset-2 hover:underline">
                        {name}
                      </Link>
                    ) : (
                      <span className="text-ink-muted">{name}</span>
                    )}
                  </td>
                  <td className="max-w-[260px] px-3 py-2.5">
                    <span className="block truncate text-ink" title={o.scheme}>
                      {o.scheme}
                    </span>
                  </td>
                  <td className={`${cell} text-ink-soft`}>{OrderTypeLabel[o.type]}</td>
                  <td className={`${cell} tabular text-right font-medium text-ink`}>{amountText(o)}</td>
                  <td className={`${cell} text-ink-soft`}>{o.paymentMode ?? '—'}</td>
                  <td className={cell}>
                    <Badge tone={StateTone[o.state]}>{OrderStateLabel[o.state]}</Badge>
                  </td>
                </OrderRow>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

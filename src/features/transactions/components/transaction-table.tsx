'use client';

import { ArrowLeftRight, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, Td } from '@/components/ui/table';
import { ItemPanelProvider, ItemRow } from '@/features/investors/components/item-panel/item-panel';
import { allUnitsText, stateTone } from '@/features/investors/money-labels';
import { refreshOrder } from '@/features/transactions/actions';
import { FlagHint, FlagLabel, FlagTone, OrderStateLabel, OrderTypeLabel } from '@/features/transactions/labels';
import type { MonitoredOrder } from '@/types/admin-api.types';
import { formatDateTime, humanize, timeAgo } from '@/utils/format';

const Headers = ['Placed', 'Investor', 'Order', 'Amount', 'State', 'Needs', ''] as const;

/** Rupees when the order has an amount, else units (switches and redemptions can be placed by units). */
const exact = (amount: string | null, units: string | null): string => {
  if (amount !== null) return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (units !== null) return `${Number(units).toLocaleString('en-IN', { maximumFractionDigits: 4 })} units`;
  return '—';
};

/** Asks FP for the order's current state. It changes nothing at FP; it only brings our copy up to date. */
function RefreshButton({ order, onRefreshed }: { order: MonitoredOrder; onRefreshed: (order: MonitoredOrder) => void }): React.JSX.Element {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        aria-label="Refresh from FP"
        title={error ?? 'Refresh from FP'}
        disabled={pending}
        onClick={(event) => {
          // The row itself opens the side panel; this button must not.
          event.stopPropagation();
          setError(null);
          start(async () => {
            const result = await refreshOrder(order.id);
            if (result.order) onRefreshed(result.order);
            else setError(result.error);
          });
        }}
        onKeyDown={(event) => event.stopPropagation()}
        className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink disabled:opacity-50"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
      </button>
      {error ? <span className="max-w-[160px] truncate text-[11.5px] text-danger">{error}</span> : null}
    </span>
  );
}

export function TransactionTable({ orders }: { orders: MonitoredOrder[] }): React.JSX.Element {
  // A refreshed row is replaced in place, so the list does not jump while someone works down it.
  const [overrides, setOverrides] = useState<Record<string, MonitoredOrder>>({});

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<ArrowLeftRight className="size-5" />}
        title="No orders match"
        description="Nothing for these filters. Widen the date range or clear the filters."
      />
    );
  }

  return (
    <ItemPanelProvider>
      <Table headers={Headers}>
        {orders.map((original) => {
          const order = overrides[original.id] ?? original;
          const name = order.investor.name ?? 'Unnamed investor';
          return (
            <ItemRow
              key={order.id}
              item={{ type: order.kind, id: order.id, ...(order.investor.id && { userId: order.investor.id }) }}
              label={`${OrderTypeLabel[order.type]} for ${name}`}
            >
              <Td className="whitespace-nowrap">
                <span className="block text-[13px] text-ink">{formatDateTime(order.placedAt)}</span>
                <span className="block text-[11.5px] text-ink-muted">{timeAgo(order.placedAt)}</span>
              </Td>
              <Td>
                {order.investor.id ? (
                  <Link
                    href={`/investors/${order.investor.id}`}
                    onClick={(event) => event.stopPropagation()}
                    className="block truncate text-[13.5px] font-semibold text-ink hover:text-brand"
                  >
                    {name}
                  </Link>
                ) : (
                  <span className="block truncate text-[13.5px] font-semibold text-ink">{name}</span>
                )}
                {order.investor.pan ? <span className="tabular block text-[12px] text-ink-muted">{order.investor.pan}</span> : null}
              </Td>
              <Td>
                <span className="block text-[13px] font-medium text-ink">{OrderTypeLabel[order.type]}</span>
                <span className="block max-w-[300px] truncate text-[12px] text-ink-muted" title={order.scheme}>
                  {order.scheme}
                </span>
                {order.toScheme ? (
                  <span className="block max-w-[300px] truncate text-[12px] text-ink-muted" title={order.toScheme}>
                    → {order.toScheme}
                  </span>
                ) : null}
              </Td>
              <Td className="tabular whitespace-nowrap">
                <span className="block text-ink">{allUnitsText(order) ?? exact(order.amount, order.units)}</span>
                {order.processedAmount ? (
                  <span className="block text-[11.5px] text-ink-muted">Processed {exact(order.processedAmount, null)}</span>
                ) : null}
                {order.payment ? (
                  <span className="block text-[11.5px] text-ink-muted">Payment {humanize(order.payment.status).toLowerCase()}</span>
                ) : null}
              </Td>
              <Td>
                <Badge tone={stateTone(order.state)}>{OrderStateLabel[order.state]}</Badge>
                {order.failureReason ? (
                  <span className="mt-1 block max-w-[220px] truncate text-[11.5px] text-danger" title={order.failureReason}>
                    {order.failureReason}
                  </span>
                ) : null}
              </Td>
              <Td>
                {order.flag ? (
                  <span title={FlagHint[order.flag]}>
                    <Badge tone={FlagTone[order.flag]} dot>
                      {FlagLabel[order.flag]}
                    </Badge>
                  </span>
                ) : (
                  <span className="text-[12px] text-ink-muted">—</span>
                )}
              </Td>
              <Td className="w-12 text-right">
                <RefreshButton order={order} onRefreshed={(fresh) => setOverrides((current) => ({ ...current, [fresh.id]: fresh }))} />
              </Td>
            </ItemRow>
          );
        })}
      </Table>
    </ItemPanelProvider>
  );
}

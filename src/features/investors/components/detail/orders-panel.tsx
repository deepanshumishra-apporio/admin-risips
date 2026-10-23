'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Table, Td } from '@/components/ui/table';
import { ItemRow } from '@/features/investors/components/item-panel/item-panel';
import { allUnitsText, OrderKindLabel, OrderSourceLabel, stateTone } from '@/features/investors/money-labels';
import type { InvestorItemType, Order, OrderKind } from '@/types/admin-api.types';

const OrderItemType: Record<OrderKind, InvestorItemType> = { PURCHASE: 'purchase', REDEMPTION: 'redemption', SWITCH: 'switch' };
import { cn } from '@/utils/cn';
import { formatDateTime, formatInrString, humanize } from '@/utils/format';

const Filters: { key: 'ALL' | OrderKind; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PURCHASE', label: 'Purchases' },
  { key: 'REDEMPTION', label: 'Redemptions' },
  { key: 'SWITCH', label: 'Switches' },
];

const KindTone = { PURCHASE: 'brand', REDEMPTION: 'violet', SWITCH: 'neutral' } as const;

const unitsText = (value: string | null): string | null =>
  value === null ? null : `${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 4 })} units`;

/** Requested vs what the RTA actually did — they differ by stamp duty, NAV and partial fills. */
function Amounts({ order }: { order: Order }): React.JSX.Element {
  const requested = order.amount
    ? formatInrString(order.amount, { compact: false })
    : allUnitsText(order) ?? unitsText(order.units) ?? '—';
  const processed = order.processedAmount
    ? formatInrString(order.processedAmount, { compact: false })
    : unitsText(order.processedUnits);

  return (
    <>
      <span className="tabular block font-semibold text-ink">{requested}</span>
      {processed ? (
        <span className="tabular block text-[11.5px] text-ink-muted">
          {order.kind === 'PURCHASE' ? 'allotted' : order.kind === 'REDEMPTION' ? 'redeemed' : 'switched'} {processed}
        </span>
      ) : null}
    </>
  );
}

export function OrdersPanel({ orders }: { orders: Order[] }): React.JSX.Element {
  const [filter, setFilter] = useState<'ALL' | OrderKind>('ALL');
  const visible = filter === 'ALL' ? orders : orders.filter((order) => order.kind === filter);
  const count = (key: 'ALL' | OrderKind) => (key === 'ALL' ? orders.length : orders.filter((order) => order.kind === key).length);

  return (
    <Card>
      <CardHeader
        title="Orders"
        action={
          <div className="flex flex-wrap gap-1">
            {Filters.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-[12px] font-medium transition-colors',
                  filter === item.key ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line-strong text-ink-soft hover:bg-surface-sunken',
                )}
              >
                {item.label} <span className="tabular text-ink-muted">{count(item.key)}</span>
              </button>
            ))}
          </div>
        }
      />
      {visible.length === 0 ? (
        <CardBody>
          <p className="text-[13px] text-ink-muted">No orders of this kind.</p>
        </CardBody>
      ) : (
        <Table headers={['Placed', 'Type', 'Scheme', 'Amount', 'Folio', 'State']}>
          {visible.map((order) => (
            <ItemRow key={order.id} item={{ type: OrderItemType[order.kind], id: order.id }} label={`${order.kind.toLowerCase()} ${order.scheme}`}>
              <Td className="text-[13px]">
                {formatDateTime(order.placedAt)}
              </Td>
              <Td>
                <Badge tone={KindTone[order.kind]}>{OrderKindLabel[order.kind]}</Badge>
                {order.source !== 'ONE_TIME' ? (
                  <span className="ml-1.5 text-[11.5px] font-medium text-ink-muted" title={OrderSourceLabel[order.source]}>
                    {order.source}
                  </span>
                ) : null}
              </Td>
              <Td>
                <span className="block font-medium text-ink">{order.scheme}</span>
                {order.toScheme ? <span className="block text-[12px] text-ink-muted">→ {order.toScheme}</span> : null}
              </Td>
              <Td>
                <Amounts order={order} />
              </Td>
              <Td className="tabular text-[13px]">{order.folioNumber ?? '—'}</Td>
              <Td>
                <Badge tone={stateTone(order.state)}>{humanize(order.state)}</Badge>
                {order.failureReason ? (
                  <span className="mt-1 block max-w-[220px] truncate text-[11.5px] text-danger" title={order.failureReason}>
                    {order.failureReason}
                  </span>
                ) : null}
              </Td>
            </ItemRow>
          ))}
        </Table>
      )}
    </Card>
  );
}

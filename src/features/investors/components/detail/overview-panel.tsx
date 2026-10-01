import { AlertTriangle, CalendarClock, PauseCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ItemButton } from '@/features/investors/components/item-panel/item-panel';
import { PlanKindLabel } from '@/features/investors/money-labels';
import type { InvestorInvestments, InvestorItemType, PlanKind } from '@/types/admin-api.types';

const PlanItemType: Record<PlanKind, InvestorItemType> = { SIP: 'sip', SWP: 'swp', STP: 'stp' };
import { formatCount, formatDate, formatInrString } from '@/utils/format';

const KindTone = { SIP: 'brand', SWP: 'violet', STP: 'neutral' } as const;

function daysUntil(date: string): number {
  const today = new Date(new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10));
  return Math.round((Date.parse(date) - today.getTime()) / 86_400_000);
}

const when = (date: string): string => {
  const days = daysUntil(date);
  if (days < 0) return `${formatDate(date)} · overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${formatDate(date)} · in ${days} days`;
};

/** What happens next, and the money in and out so far — the first things support is asked about. */
export function OverviewPanel({ investments }: { investments: InvestorInvestments }): React.JSX.Element {
  const { upcoming, orderTotals, summary } = investments;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Coming up"
          subtitle="The next instalment of every live SIP, SWP and STP, soonest first"
        />
        {upcoming.length === 0 ? (
          <CardBody>
            <p className="text-[13px] text-ink-muted">No instalments scheduled.</p>
          </CardBody>
        ) : (
          <ul className="divide-y divide-line">
            {upcoming.map((item) => (
              <li key={item.planId}>
                <ItemButton
                  item={{ type: PlanItemType[item.kind], id: item.planId }}
                  label={`${item.kind} ${item.scheme}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-sunken"
                >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-ink-muted">
                  <CalendarClock className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <Badge tone={KindTone[item.kind]}>{PlanKindLabel[item.kind]}</Badge>
                    <span className="truncate text-[13.5px] font-medium text-ink">
                      {item.scheme}
                      {item.toScheme ? <span className="text-ink-muted"> → {item.toScheme}</span> : null}
                    </span>
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12px] text-ink-muted">
                    {when(item.date)}
                    {item.paused ? (
                      <span className="inline-flex items-center gap-1 text-warn">
                        <PauseCircle className="size-3.5" /> Paused
                      </span>
                    ) : null}
                    {item.mandateReady === false ? (
                      <span className="inline-flex items-center gap-1 text-danger">
                        <AlertTriangle className="size-3.5" /> Mandate not approved
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className="tabular shrink-0 text-right text-[13.5px] font-semibold text-ink">
                  {item.amount ? formatInrString(item.amount, { compact: false }) : `${item.units} units`}
                </span>
                </ItemButton>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Money moved" subtitle="Successful orders, all time" />
          <CardBody>
            <dl className="space-y-2.5 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Invested (purchases)</dt>
                <dd className="tabular font-semibold text-ink">{formatInrString(orderTotals.purchased, { compact: false })}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Redeemed</dt>
                <dd className="tabular font-semibold text-ink">{formatInrString(orderTotals.redeemed, { compact: false })}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Switched between schemes</dt>
                <dd className="tabular font-semibold text-ink">{formatInrString(orderTotals.switched, { compact: false })}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Plans and orders" />
          <CardBody>
            <dl className="space-y-2.5 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Active SIPs</dt>
                <dd className="tabular font-semibold text-ink">
                  {formatCount(summary.activeSips)} · {formatInrString(summary.sipMonthlyAmount, { compact: false })}/mo
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Active SWPs · STPs</dt>
                <dd className="tabular font-semibold text-ink">
                  {formatCount(summary.activeSwps)} · {formatCount(summary.activeStps)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Orders in progress</dt>
                <dd className="tabular font-semibold text-ink">{formatCount(orderTotals.inFlight)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Failed orders</dt>
                <dd className={`tabular font-semibold ${orderTotals.failed ? 'text-danger' : 'text-ink'}`}>
                  {formatCount(orderTotals.failed)}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

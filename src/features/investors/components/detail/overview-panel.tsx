import { AlertTriangle, CalendarClock, PauseCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { OverviewCharts } from '@/features/investors/components/detail/overview-charts';
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

function Tile({ label, value, danger = false }: { label: string; value: string; danger?: boolean }): React.JSX.Element {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3">
      <dt className="text-[12px] text-ink-muted">{label}</dt>
      <dd className={`tabular mt-1 text-[17px] leading-none font-semibold ${danger ? 'text-danger' : 'text-ink'}`}>{value}</dd>
    </div>
  );
}

/** What happens next, and the money in and out so far — the first things support is asked about. */
export function OverviewPanel({ investments }: { investments: InvestorInvestments }): React.JSX.Element {
  const { upcoming, orderTotals } = investments;

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Tile label="Purchased" value={formatInrString(orderTotals.purchased)} />
        <Tile label="Redeemed" value={formatInrString(orderTotals.redeemed)} />
        <Tile label="Switched" value={formatInrString(orderTotals.switched)} />
        <Tile label="In progress" value={formatCount(orderTotals.inFlight)} />
        <Tile label="Failed" value={formatCount(orderTotals.failed)} danger={orderTotals.failed > 0} />
      </dl>

      <OverviewCharts investments={investments} />

      <Card>
        <CardHeader title="Coming up" />
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
                        <AlertTriangle className="size-3.5" /> No mandate
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

    </div>
  );
}

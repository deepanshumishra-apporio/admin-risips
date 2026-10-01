import { PauseCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Table, Td } from '@/components/ui/table';
import { ItemRow } from '@/features/investors/components/item-panel/item-panel';
import { PlanKindDescription, PlanKindLabel, isLivePlan, stateTone } from '@/features/investors/money-labels';
import type { InvestorInvestments, InvestorItemType, Plan, PlanKind } from '@/types/admin-api.types';

const PlanItemType: Record<PlanKind, InvestorItemType> = { SIP: 'sip', SWP: 'swp', STP: 'stp' };
import { formatDate, formatInrString, humanize } from '@/utils/format';

const ordinal = (day: number): string => {
  const suffix = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  return `${day}${suffix}`;
};

function Schedule({ plan }: { plan: Plan }): React.JSX.Element {
  return (
    <>
      {humanize(plan.frequency)}
      {plan.installmentDay ? <span className="block text-[11.5px] text-ink-muted">on the {ordinal(plan.installmentDay)}</span> : null}
    </>
  );
}

function Progress({ plan }: { plan: Plan }): React.JSX.Element {
  const done = plan.installmentsSucceeded;
  const pct = plan.totalInstallments ? (done / plan.totalInstallments) * 100 : 0;
  const failed = plan.installmentsPlaced - plan.installmentsSucceeded;
  return (
    <div className="min-w-[120px]">
      <span className="tabular text-[12.5px] text-ink">
        {done} of {plan.totalInstallments}
      </span>
      <ProgressBar value={pct} className="mt-1" />
      {failed > 0 ? <span className="mt-0.5 block text-[11.5px] text-ink-muted">{failed} not successful</span> : null}
    </div>
  );
}

function PlanTable({ kind, plans }: { kind: PlanKind; plans: Plan[] }): React.JSX.Element {
  const live = plans.filter((plan) => isLivePlan(plan.state)).length;

  return (
    <Card>
      <CardHeader title={`${PlanKindLabel[kind]}s`} subtitle={`${PlanKindDescription[kind]} · ${live} live of ${plans.length}`} />
      {plans.length === 0 ? (
        <CardBody>
          <p className="text-[13px] text-ink-muted">None set up.</p>
        </CardBody>
      ) : (
        <Table
          headers={[
            'Scheme',
            kind === 'SIP' ? 'Amount' : 'Amount / units',
            'Schedule',
            'Next instalment',
            'Progress',
            kind === 'SIP' ? 'Mandate' : 'Period',
            'State',
          ]}
        >
          {plans.map((plan) => (
            <ItemRow key={plan.id} item={{ type: PlanItemType[kind], id: plan.id }} label={`${kind} ${plan.scheme}`}>
              <Td>
                <span className="block font-medium text-ink">{plan.scheme}</span>
                {plan.toScheme ? <span className="block text-[12px] text-ink-muted">→ {plan.toScheme}</span> : null}
                {plan.folioNumber ? <span className="tabular block text-[11.5px] text-ink-muted">Folio {plan.folioNumber}</span> : null}
              </Td>
              <Td className="tabular font-semibold text-ink">
                {plan.amount ? formatInrString(plan.amount, { compact: false }) : plan.units ? `${plan.units} units` : '—'}
              </Td>
              <Td className="text-[13px]">
                <Schedule plan={plan} />
              </Td>
              <Td className="text-[13px]">
                {plan.nextInstallmentDate && isLivePlan(plan.state) ? formatDate(plan.nextInstallmentDate) : '—'}
                {plan.previousInstallmentDate ? (
                  <span className="block text-[11.5px] text-ink-muted">last {formatDate(plan.previousInstallmentDate)}</span>
                ) : null}
              </Td>
              <Td>
                <Progress plan={plan} />
              </Td>
              <Td className="text-[13px]">
                {kind === 'SIP' ? (
                  plan.mandate ? (
                    <>
                      <Badge tone={stateTone(plan.mandate.status)}>{humanize(plan.mandate.status)}</Badge>
                      <span className="mt-1 block text-[11.5px] text-ink-muted">{humanize(plan.mandate.type)}</span>
                    </>
                  ) : (
                    <span className="text-ink-muted">None linked</span>
                  )
                ) : (
                  <>
                    {plan.startDate ? formatDate(plan.startDate) : '—'}
                    {plan.endDate ? <span className="block text-[11.5px] text-ink-muted">to {formatDate(plan.endDate)}</span> : null}
                  </>
                )}
              </Td>
              <Td>
                <Badge tone={stateTone(plan.state)}>{humanize(plan.state)}</Badge>
                {plan.pause ? (
                  <span className="mt-1 flex items-center gap-1 text-[11.5px] text-warn">
                    <PauseCircle className="size-3.5" />
                    Paused {plan.pause.from ? formatDate(plan.pause.from) : ''}
                    {plan.pause.to ? ` – ${formatDate(plan.pause.to)}` : ''}
                  </span>
                ) : null}
                {plan.cancelledAt ? (
                  <span className="mt-1 block text-[11.5px] text-ink-muted">Cancelled {formatDate(plan.cancelledAt)}</span>
                ) : null}
                {plan.reason ? <span className="mt-1 block max-w-[200px] text-[11.5px] text-ink-muted">{humanize(plan.reason)}</span> : null}
              </Td>
            </ItemRow>
          ))}
        </Table>
      )}
    </Card>
  );
}

export function PlansPanel({ plans }: { plans: InvestorInvestments['plans'] }): React.JSX.Element {
  return (
    <div className="space-y-4">
      <PlanTable kind="SIP" plans={plans.sips} />
      <PlanTable kind="SWP" plans={plans.swps} />
      <PlanTable kind="STP" plans={plans.stps} />
    </div>
  );
}

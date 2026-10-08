import { PauseCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Table, Td } from '@/components/ui/table';
import { ItemRow } from '@/features/investors/components/item-panel/item-panel';
import { PlanKindLabel, isLivePlan, stateTone } from '@/features/investors/money-labels';
import type { InvestorItemType, Plan, PlanKind } from '@/types/admin-api.types';

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
      {plan.installmentDay ? <span className="text-ink-muted"> · {ordinal(plan.installmentDay)}</span> : null}
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
      {failed > 0 ? <span className="mt-0.5 block text-[11.5px] text-danger">{failed} failed</span> : null}
    </div>
  );
}

function PlanTable({ kind, plans }: { kind: PlanKind; plans: Plan[] }): React.JSX.Element {
  const live = plans.filter((plan) => isLivePlan(plan.state)).length;

  return (
    <Card>
      <CardHeader
        title={`${PlanKindLabel[kind]}s`}
        action={plans.length ? <Badge tone={live ? 'success' : 'neutral'}>{live} live of {plans.length}</Badge> : null}
      />
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
              </Td>
              <Td className="tabular font-semibold text-ink">
                {plan.amount ? formatInrString(plan.amount, { compact: false }) : plan.units ? `${plan.units} units` : '—'}
              </Td>
              <Td className="text-[13px]">
                <Schedule plan={plan} />
              </Td>
              <Td className="text-[13px]">
                {plan.nextInstallmentDate && isLivePlan(plan.state) ? formatDate(plan.nextInstallmentDate) : '—'}
              </Td>
              <Td>
                <Progress plan={plan} />
              </Td>
              <Td className="text-[13px]">
                {kind === 'SIP' ? (
                  plan.mandate ? (
                    <Badge tone={stateTone(plan.mandate.status)}>{humanize(plan.mandate.status)}</Badge>
                  ) : (
                    <span className="text-ink-muted">None linked</span>
                  )
                ) : (
                  <>
                    {plan.startDate ? formatDate(plan.startDate) : '—'}
                    {plan.endDate ? <span className="text-ink-muted"> – {formatDate(plan.endDate)}</span> : null}
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
              </Td>
            </ItemRow>
          ))}
        </Table>
      )}
    </Card>
  );
}

/** One kind of plan at a time: each has its own pill on the Investments tab, so none sits below a long list. */
export function PlansPanel({ kind, plans }: { kind: PlanKind; plans: Plan[] }): React.JSX.Element {
  return <PlanTable kind={kind} plans={plans} />;
}

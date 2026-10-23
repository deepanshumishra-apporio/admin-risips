'use client';

import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { allUnitsText, OrderKindLabel, OrderSourceLabel, stateTone } from '@/features/investors/money-labels';
import type {
  HoldingDetail,
  InvestorItem,
  InvestorItemType,
  ItemEvent,
  Order,
  OrderDetail,
  PaymentDetail,
  PlanDetail,
  PlanKind,
  SchemeFacts,
} from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatDate, formatDateTime, formatInrString, humanize } from '@/utils/format';

type Open = (ref: { type: InvestorItemType; id: string }) => void;

const OrderType: Record<Order['kind'], InvestorItemType> = { PURCHASE: 'purchase', REDEMPTION: 'redemption', SWITCH: 'switch' };
const PlanType: Record<PlanKind, InvestorItemType> = { SIP: 'sip', SWP: 'swp', STP: 'stp' };

const inr = (value: string | null | undefined): string | null => (value ? formatInrString(value, { compact: false }) : null);
const units = (value: string | null | undefined): string | null =>
  value ? `${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 4 })} units` : null;
const nav = (value: string | null | undefined): string | null =>
  value ? `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 4 })}` : null;
const date = (value: string | null | undefined): string | null => (value ? formatDate(value) : null);
const dateTime = (value: string | null | undefined): string | null => (value ? formatDateTime(value) : null);

// --- building blocks -------------------------------------------------------------------

/** Secondary detail folds away behind its title, so the panel opens on what matters. */
function More({ title, children }: { title: string; children: ReactNode }): React.JSX.Element {
  return (
    <details className="group border-t border-line pt-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-[12px] font-semibold tracking-[0.05em] text-ink-muted uppercase hover:text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
      </summary>
      <div className="mt-2.5">{children}</div>
    </details>
  );
}

function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }): React.JSX.Element {
  return (
    <section className="border-t border-line pt-4 first:border-t-0 first:pt-0">
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <h3 className="text-[12px] font-semibold tracking-[0.05em] text-ink-muted uppercase">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Label / value pairs; a missing value is left out rather than shown as a dash. */
function Facts({ rows }: { rows: [string, ReactNode | null | undefined][] }): React.JSX.Element {
  const shown = rows.filter(([, value]) => value !== null && value !== undefined && value !== '');
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5">
      {shown.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-[12px] text-ink-muted">{label}</dt>
          <dd className="mt-0.5 text-[13.5px] break-words text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Events({ events }: { events: ItemEvent[] }): React.JSX.Element {
  if (events.length === 0) return <p className="text-[13px] text-ink-muted">Nothing yet.</p>;
  return (
    <ol className="relative space-y-3 border-l border-line pl-4">
      {events.map((event) => (
        <li key={`${event.at}-${event.label}`} className="relative">
          <span className="absolute top-1.5 -left-[21px] size-2 rounded-full border-2 border-surface bg-brand" />
          <p className="text-[13px] font-medium text-ink">{event.label}</p>
          <p className="text-[12px] text-ink-muted">{formatDateTime(event.at)}</p>
        </li>
      ))}
    </ol>
  );
}

function OrderList({ orders, onOpen, empty }: { orders: Order[]; onOpen: Open; empty: string }): React.JSX.Element {
  if (orders.length === 0) return <p className="text-[13px] text-ink-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line rounded-lg border border-line">
      {orders.map((order) => (
        <li key={order.id}>
          <button
            type="button"
            onClick={() => onOpen({ type: OrderType[order.kind], id: order.id })}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-sunken"
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-ink">{OrderKindLabel[order.kind]}</span>
                <span className="text-[11.5px] text-ink-muted">{OrderSourceLabel[order.source]}</span>
              </span>
              <span className="block truncate text-[12px] text-ink-muted">
                {formatDateTime(order.placedAt)}
                {order.toScheme ? ` · → ${order.toScheme}` : ''}
              </span>
            </span>
            <span className="tabular text-right text-[13px] font-semibold text-ink">
              {inr(order.processedAmount ?? order.amount) ?? allUnitsText(order) ?? units(order.units) ?? '—'}
            </span>
            <Badge tone={stateTone(order.state)}>{humanize(order.state)}</Badge>
            <ChevronRight className="size-4 shrink-0 text-ink-muted" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function Scheme({ facts }: { facts: SchemeFacts }): React.JSX.Element {
  return (
    <Facts
      rows={[
        ['Scheme', facts.name],
        ['AMC', facts.amc],
        ['ISIN', <span key="isin" className="tabular">{facts.isin}</span>],
        ['Category', [humanize(facts.category), facts.subCategory].filter(Boolean).join(' · ')],
        ['Plan · option', `${humanize(facts.planType)} · ${humanize(facts.option)}`],
        ['Latest NAV', facts.latestNav ? `${nav(facts.latestNav)}${facts.latestNavDate ? ` (${formatDate(facts.latestNavDate)})` : ''}` : null],
        ['Expense ratio', facts.expenseRatio ? `${Number(facts.expenseRatio)}%` : null],
        ['Exit load', facts.exitLoadPercent ? `${Number(facts.exitLoadPercent)}%` : null],
        ['Lock-in', facts.lockInDays ? `${facts.lockInDays} days` : null],
      ]}
    />
  );
}

function Headline({ label, value, sub, tone }: { label: string; value: string; sub?: string | null; tone?: 'success' | 'danger' }): React.JSX.Element {
  return (
    <div className="rounded-lg border border-line px-3 py-2.5">
      <p className="text-[12px] text-ink-muted">{label}</p>
      <p className={cn('tabular mt-0.5 text-[17px] font-semibold', tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-ink')}>
        {value}
      </p>
      {sub ? <p className="text-[11.5px] text-ink-muted">{sub}</p> : null}
    </div>
  );
}

const Reference = ({ value }: { value: string }): React.JSX.Element => (
  <span className="tabular text-[12.5px] break-all text-ink-soft select-all">{value}</span>
);

// --- views ----------------------------------------------------------------------

function HoldingView({ holding, onOpen }: { holding: HoldingDetail; onOpen: Open }): React.JSX.Element {
  const gain = holding.gain === null ? null : Number(holding.gain);
  const invested = Number(holding.investedValue ?? 0);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2.5">
        <Headline label="Current value" value={inr(holding.currentValue) ?? '—'} sub={date(holding.currentValueAsOn)} />
        <Headline label="Invested" value={inr(holding.investedValue) ?? '—'} sub={date(holding.investedValueAsOn)} />
        <Headline
          label="Gain"
          value={gain === null ? '—' : `${gain >= 0 ? '+' : '−'}${inr(String(Math.abs(gain)))}`}
          sub={gain !== null && invested > 0 ? `${((gain / invested) * 100).toFixed(2)}%` : null}
          {...(gain !== null && { tone: gain >= 0 ? ('success' as const) : ('danger' as const) })}
        />
      </div>

      <Section title="Units">
        <Facts
          rows={[
            ['Units held', units(holding.units)],
            ['Redeemable now', units(holding.redeemableUnits)],
            ['NAV', holding.nav ? `${nav(holding.nav)}${holding.navAsOn ? ` (${formatDate(holding.navAsOn)})` : ''}` : null],
            ['Dividend paid out', inr(holding.payoutAmount)],
            ['Folio', holding.folio ? <Reference key="folio" value={holding.folio.number} /> : holding.folioNumber],
          ]}
        />
      </Section>

      <Section title="Plans on this scheme" aside={<span className="text-[12px] text-ink-muted">{holding.plans.length}</span>}>
        {holding.plans.length === 0 ? (
          <p className="text-[13px] text-ink-muted">None.</p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {holding.plans.map((plan) => (
              <li key={plan.id}>
                <button
                  type="button"
                  onClick={() => onOpen({ type: PlanType[plan.kind], id: plan.id })}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-sunken"
                >
                  <Badge tone="brand">{plan.kind}</Badge>
                  <span className="flex-1 text-[13px] text-ink">
                    {inr(plan.amount) ?? '—'} · {humanize(plan.frequency)}
                    {plan.nextInstallmentDate ? <span className="text-ink-muted"> · next {formatDate(plan.nextInstallmentDate)}</span> : null}
                  </span>
                  <Badge tone={stateTone(plan.state)}>{humanize(plan.state)}</Badge>
                  <ChevronRight className="size-4 text-ink-muted" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Orders on this holding" aside={<span className="text-[12px] text-ink-muted">{holding.orders.length}</span>}>
        <OrderList orders={holding.orders} onOpen={onOpen} empty="No orders yet." />
      </Section>

      {holding.schemeFacts ? (
        <More title="Scheme details">
          <Scheme facts={holding.schemeFacts} />
        </More>
      ) : null}
    </div>
  );
}

function PlanView({ plan, onOpen }: { plan: PlanDetail; onOpen: Open }): React.JSX.Element {
  const pct = plan.totalInstallments ? (plan.installmentsSucceeded / plan.totalInstallments) * 100 : 0;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2.5">
        <Headline label="Instalment" value={inr(plan.amount) ?? units(plan.units) ?? '—'} sub={humanize(plan.frequency)} />
        <Headline label="Next" value={plan.nextInstallmentDate ? formatDate(plan.nextInstallmentDate) : '—'} sub={plan.previousInstallmentDate ? `last ${formatDate(plan.previousInstallmentDate)}` : null} />
        <Headline label="Done" value={`${plan.installmentsSucceeded} / ${plan.totalInstallments}`} sub={plan.remainingInstallments !== null ? `${plan.remainingInstallments} remaining` : null} />
      </div>
      <ProgressBar value={pct} />

      <Section title="Schedule" aside={<Badge tone={stateTone(plan.state)}>{humanize(plan.state)}</Badge>}>
        <Facts
          rows={[
            ['Scheme', plan.scheme],
            ['Into scheme', plan.toScheme],
            ['Frequency', humanize(plan.frequency)],
            ['Day of month', plan.installmentDay ? String(plan.installmentDay) : null],
            ['Start', date(plan.startDate)],
            ['End', date(plan.endDate)],
            ['Folio', plan.folioNumber],
            ['Failed', plan.installmentsPlaced > plan.installmentsSucceeded ? String(plan.installmentsPlaced - plan.installmentsSucceeded) : null],
          ]}
        />
      </Section>

      {plan.kind === 'SIP' ? (
        <Section title="Payment">
          <Facts
            rows={[
              ['Mandate', plan.mandate ? `${humanize(plan.mandate.type)} · ${humanize(plan.mandate.status)}` : 'None linked'],
              ['Payment method', plan.paymentMethod ? humanize(plan.paymentMethod) : null],
              ['Purpose', plan.purpose ? humanize(plan.purpose) : null],
              ['Paused', plan.pause ? `${humanize(plan.pause.state)} · ${date(plan.pause.from) ?? '?'} – ${date(plan.pause.to) ?? '?'}` : null],
            ]}
          />
        </Section>
      ) : null}

      {plan.cancelledAt || plan.cancellationCode || plan.reason || plan.autoCancelled ? (
        <Section title="Cancellation">
          <Facts
            rows={[
              ['Cancelled', dateTime(plan.cancelledAt)],
              ['Scheduled for', date(plan.cancellationScheduledOn)],
              ['Code', plan.cancellationCode ? humanize(plan.cancellationCode) : null],
              ['Reason', plan.reason ? humanize(plan.reason) : null],
              ['Automatic', plan.autoCancelled === null ? null : plan.autoCancelled ? 'Yes' : 'No'],
            ]}
          />
        </Section>
      ) : null}

      <Section title="Instalments" aside={<span className="text-[12px] text-ink-muted">{plan.installments.length}</span>}>
        <OrderList orders={plan.installments} onOpen={onOpen} empty="None placed yet." />
      </Section>

      <More title="History">
        <Events events={plan.events} />
      </More>

      <More title="Scheme details">
        <Scheme facts={plan.schemeFacts} />
      </More>

      <More title="References">
        <Facts rows={[['FP plan id', <Reference key="fp" value={plan.fpId} />], ['Gateway', plan.gateway ? humanize(plan.gateway) : null]]} />
      </More>
    </div>
  );
}

function OrderView({ order, onOpen }: { order: OrderDetail; onOpen: Open }): React.JSX.Element {
  const verb = order.kind === 'PURCHASE' ? 'Allotted' : order.kind === 'REDEMPTION' ? 'Redeemed' : 'Switched';
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2.5">
        <Headline label="Requested" value={inr(order.amount) ?? allUnitsText(order) ?? units(order.units) ?? '—'} />
        <Headline label={verb} value={inr(order.processedAmount) ?? units(order.processedUnits) ?? '—'} sub={order.processedAmount ? units(order.processedUnits) : null} />
        <Headline label="NAV" value={nav(order.price) ?? '—'} sub={date(order.navDate)} />
      </div>

      <Section title="Order" aside={<Badge tone={stateTone(order.state)}>{humanize(order.state)}</Badge>}>
        <Facts
          rows={[
            ['Type', `${OrderKindLabel[order.kind]}${order.subtype ? ` · ${humanize(order.subtype)}` : ''}`],
            ['Source', OrderSourceLabel[order.source]],
            ['Scheme', order.scheme],
            ['Into scheme', order.toScheme],
            ['Folio', order.folioNumber],
            ['Scheduled for', date(order.scheduledOn)],
            ['Traded on', date(order.tradedOn)],
            ['Initiated', [order.initiatedBy, order.initiatedVia].filter(Boolean).map((part) => humanize(part)).join(' · ') || null],
          ]}
        />
      </Section>

      {order.failureReason || order.failureCode ? (
        <Section title="Why it failed">
          <p className="rounded-md border border-danger/25 bg-danger-soft px-3 py-2.5 text-[13px] text-danger">
            {order.failureReason ?? humanize(order.failureCode)}
            {order.failureCode && order.failureReason ? <span className="mt-1 block text-[11.5px] opacity-80">Code: {order.failureCode}</span> : null}
          </p>
        </Section>
      ) : null}

      {order.plan ? (
        <Section title="Instalment of">
          <button
            type="button"
            onClick={() => onOpen({ type: PlanType[order.plan!.kind], id: order.plan!.id })}
            className="flex w-full items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-left hover:bg-surface-sunken"
          >
            <Badge tone="brand">{order.plan.kind}</Badge>
            <span className="flex-1 text-[13px] text-ink">{order.plan.scheme}</span>
            <ChevronRight className="size-4 text-ink-muted" />
          </button>
        </Section>
      ) : null}

      {order.consent ? (
        <More title="Investor consent (2FA)">
          <Facts rows={[['Given', dateTime(order.consent.at)], ['Email', order.consent.email], ['Mobile', order.consent.mobile]]} />
        </More>
      ) : null}

      {order.payoutAccount ? (
        <Section title="Paid out to">
          <Facts rows={[['Account', order.payoutAccount.accountNumber], ['IFSC', order.payoutAccount.ifsc]]} />
        </Section>
      ) : null}

      {order.kind === 'PURCHASE' ? (
        <Section title="Payments" aside={<span className="text-[12px] text-ink-muted">{order.payments.length}</span>}>
          {order.payments.length === 0 ? (
            <p className="text-[13px] text-ink-muted">None recorded.</p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {order.payments.map((payment) => (
                <li key={payment.id}>
                  <button
                    type="button"
                    onClick={() => onOpen({ type: 'payment', id: payment.id })}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-sunken"
                  >
                    <span className="flex-1 text-[13px] text-ink">
                      {humanize(payment.type)} <span className="text-ink-muted">· {formatDateTime(payment.createdAt)}</span>
                    </span>
                    <span className="tabular text-[13px] font-semibold text-ink">{inr(payment.amount)}</span>
                    <Badge tone={stateTone(payment.status)}>{humanize(payment.status)}</Badge>
                    <ChevronRight className="size-4 text-ink-muted" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      ) : null}

      <More title="History">
        <Events events={order.events} />
      </More>

      <More title="Scheme details">
        <Scheme facts={order.schemeFacts} />
      </More>

      <More title="References">
        <Facts
          rows={[
            ['FP order id', <Reference key="fp" value={order.fpId} />],
            ['Our reference', order.sourceRefId ? <Reference key="ref" value={order.sourceRefId} /> : null],
            ['Gateway', order.gateway ? humanize(order.gateway) : null],
          ]}
        />
      </More>
    </div>
  );
}

function PaymentView({ payment, onOpen }: { payment: PaymentDetail; onOpen: Open }): React.JSX.Element {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2.5">
        <Headline label="Amount" value={inr(payment.amount) ?? '—'} sub={humanize(payment.type)} />
        <Headline label="Status" value={humanize(payment.status)} sub={payment.settledAt ? `settled ${formatDate(payment.settledAt)}` : null} />
      </div>

      <Section title="Payment">
        <Facts
          rows={[
            ['Method', payment.method ? humanize(payment.method) : null],
            ['Provider', payment.provider ? humanize(payment.provider) : null],
            ['Debit date', date(payment.debitDate)],
            ['From account', payment.bankAccount ? `${payment.bankAccount.bankName ?? 'Bank'} · ${payment.bankAccount.accountNumber}` : null],
            ['Mandate', payment.mandate ? `${humanize(payment.mandate.type)} · ${humanize(payment.mandate.status)}` : null],
            ['UMRN', payment.mandate?.umrn],
            ['Authorised late', payment.lateAuth ? 'Yes' : null],
          ]}
        />
      </Section>

      {payment.failureReason || payment.failureCode ? (
        <Section title="Why it failed">
          <p className="rounded-md border border-danger/25 bg-danger-soft px-3 py-2.5 text-[13px] text-danger">
            {payment.failureReason ?? humanize(payment.failureCode)}
          </p>
        </Section>
      ) : null}

      {payment.refund ? (
        <Section title="Refund">
          <Facts
            rows={[
              ['Status', payment.refund.status ? humanize(payment.refund.status) : null],
              ['Reference', payment.refund.reference],
              ['Reason', payment.refund.reason],
              ['Raised', dateTime(payment.refund.at)],
            ]}
          />
        </Section>
      ) : null}

      <Section title="Pays for" aside={<span className="text-[12px] text-ink-muted">{payment.purchases.length}</span>}>
        <OrderList orders={payment.purchases} onOpen={onOpen} empty="No linked purchase." />
      </Section>

      <More title="History">
        <Events events={payment.events} />
      </More>

      <More title="References">
        <Facts rows={[['FP payment id', <Reference key="fp" value={String(payment.fpId)} />]]} />
      </More>
    </div>
  );
}

export function itemHeading(item: InvestorItem): { title: string; subtitle?: string } {
  switch (item.type) {
    case 'holding':
      return { title: item.holding.scheme, subtitle: `Holding · folio ${item.holding.folioNumber}` };
    case 'plan':
      return {
        title: `${item.plan.kind} · ${item.plan.scheme}`,
        subtitle: `${inr(item.plan.amount) ?? units(item.plan.units) ?? ''} ${humanize(item.plan.frequency).toLowerCase()}${item.plan.toScheme ? ` → ${item.plan.toScheme}` : ''}`,
      };
    case 'order':
      return {
        title: `${OrderKindLabel[item.order.kind]} · ${item.order.scheme}`,
        subtitle: `${OrderSourceLabel[item.order.source]} · placed ${formatDateTime(item.order.placedAt)}`,
      };
    case 'payment':
      return { title: `Payment · ${inr(item.payment.amount)}`, subtitle: `${humanize(item.payment.type)} · ${formatDateTime(item.payment.createdAt)}` };
  }
}

export function ItemView({ item, onOpen }: { item: InvestorItem; onOpen: Open }): React.JSX.Element {
  switch (item.type) {
    case 'holding':
      return <HoldingView holding={item.holding} onOpen={onOpen} />;
    case 'plan':
      return <PlanView plan={item.plan} onOpen={onOpen} />;
    case 'order':
      return <OrderView order={item.order} onOpen={onOpen} />;
    case 'payment':
      return <PaymentView payment={item.payment} onOpen={onOpen} />;
  }
}

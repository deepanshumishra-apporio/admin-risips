'use client';

import { useState } from 'react';

import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { stateTone } from '@/features/investors/money-labels';
import type { InvestorInvestments, Order, Plan } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatCount, formatInr } from '@/utils/format';

/** Categorical order, validated for colour-blind separation on the white surface. Never cycled. */
const Series = ['#0a71da', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#4a3aa7'];
const Other = 'var(--color-line-strong)';
const MaxSlices = 5;

const inr = (value: number): string => formatInr(value);
const num = (value: string | null | undefined): number => (value ? Number(value) || 0 : 0);

function Empty({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <p className="py-8 text-center text-[13px] text-ink-muted">{children}</p>;
}

// --- Ring ------------------------------------------------------------------------

type Slice = { label: string; value: number; color: string };

/** Donut with a 2px surface gap between segments; the hovered segment thickens and fills the centre readout. */
function Ring({
  slices,
  size = 148,
  thickness = 16,
  centerValue,
  centerLabel,
  active,
  onActive,
}: {
  slices: Slice[];
  size?: number;
  thickness?: number;
  centerValue: string;
  centerLabel: string;
  active: number | null;
  onActive: (index: number | null) => void;
}): React.JSX.Element {
  const radius = (size - thickness - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const gap = slices.length > 1 ? 3 : 0;
  let offset = 0;
  const hovered = active === null ? null : slices[active];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={centerLabel} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-surface-sunken)" strokeWidth={thickness} />
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {total > 0
          ? slices.map((slice, index) => {
              const length = (slice.value / total) * circumference;
              const visible = Math.max(0.5, length - gap);
              const element = (
                <circle
                  key={slice.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={active === index ? thickness + 6 : thickness}
                  strokeDasharray={`${visible} ${circumference - visible}`}
                  strokeDashoffset={-offset}
                  className="cursor-pointer transition-[stroke-width] duration-150"
                  onPointerEnter={() => onActive(index)}
                  onPointerLeave={() => onActive(null)}
                />
              );
              offset += length;
              return element;
            })
          : null}
      </g>
      <text x={size / 2} y={size / 2 - 1} textAnchor="middle" className="tabular fill-[var(--color-ink)] text-[18px] font-semibold">
        {hovered ? (slices.length && total ? `${Math.round((hovered.value / total) * 100)}%` : '') : centerValue}
      </text>
      <text x={size / 2} y={size / 2 + 17} textAnchor="middle" className="fill-[var(--color-ink-muted)] text-[11px]">
        {hovered ? truncate(hovered.label, 22) : centerLabel}
      </text>
    </svg>
  );
}

const truncate = (text: string, max: number): string => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

function Legend({
  slices,
  format,
  active,
  onActive,
}: {
  slices: Slice[];
  format: (value: number) => string;
  active: number | null;
  onActive: (index: number | null) => void;
}): React.JSX.Element {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  return (
    <ul className="min-w-[200px] flex-1 basis-[200px] space-y-1">
      {slices.map((slice, index) => (
        <li
          key={slice.label}
          onPointerEnter={() => onActive(index)}
          onPointerLeave={() => onActive(null)}
          className={cn(
            'flex items-center justify-between gap-3 rounded-md px-1.5 py-1 text-[12.5px] transition-colors',
            active === index && 'bg-surface-sunken',
          )}
        >
          <span className="flex min-w-0 items-center gap-2 text-ink-soft">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: slice.color }} />
            <span className="line-clamp-2 leading-snug" title={slice.label}>
              {slice.label}
            </span>
          </span>
          <span className="tabular shrink-0 font-semibold text-ink">
            {format(slice.value)}
            <span className="ml-1.5 inline-block w-8 text-right font-normal text-ink-muted">
              {Math.round((slice.value / total) * 100)}%
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

// --- Allocation ------------------------------------------------------------------

function AllocationCard({ portfolio }: { portfolio: InvestorInvestments['portfolio'] }): React.JSX.Element {
  const [active, setActive] = useState<number | null>(null);
  const sorted = portfolio.holdings
    .map((holding) => ({ label: holding.scheme, value: num(holding.currentValue) }))
    .filter((holding) => holding.value > 0)
    .sort((a, b) => b.value - a.value);
  const slices: Slice[] = sorted.slice(0, MaxSlices).map((holding, index) => ({ ...holding, color: Series[index] }));
  const rest = sorted.slice(MaxSlices).reduce((sum, holding) => sum + holding.value, 0);
  if (rest > 0) slices.push({ label: `${sorted.length - MaxSlices} more schemes`, value: rest, color: Other });

  return (
    <Card>
      <CardHeader title="Allocation" />
      <CardBody>
        {slices.length === 0 ? (
          <Empty>No units held yet.</Empty>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <Ring
              slices={slices}
              centerValue={inr(num(portfolio.currentValue))}
              centerLabel="current value"
              active={active}
              onActive={setActive}
            />
            <Legend slices={slices} format={inr} active={active} onActive={setActive} />
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// --- Order outcomes ----------------------------------------------------------------

const OutcomeColor = { success: 'var(--color-success)', warn: 'var(--color-warn)', danger: 'var(--color-danger)', neutral: Other };
const OutcomeLabel = { success: 'Successful', warn: 'In progress', danger: 'Failed', neutral: 'Cancelled' };

function OutcomesCard({ orders }: { orders: Order[] }): React.JSX.Element {
  const [active, setActive] = useState<number | null>(null);
  const counts = { success: 0, warn: 0, danger: 0, neutral: 0 };
  for (const order of orders) {
    const tone = stateTone(order.state);
    if (tone in counts) counts[tone as keyof typeof counts] += 1;
  }
  const slices: Slice[] = (Object.keys(counts) as (keyof typeof counts)[])
    .filter((key) => counts[key] > 0)
    .map((key) => ({ label: OutcomeLabel[key], value: counts[key], color: OutcomeColor[key] }));
  const rate = orders.length ? Math.round((counts.success / orders.length) * 100) : 0;

  return (
    <Card>
      <CardHeader title="Order outcomes" />
      <CardBody>
        {orders.length === 0 ? (
          <Empty>No orders placed yet.</Empty>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <Ring slices={slices} centerValue={`${rate}%`} centerLabel="successful" active={active} onActive={setActive} />
            <Legend slices={slices} format={formatCount} active={active} onActive={setActive} />
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// --- Monthly flows -----------------------------------------------------------------

const Ranges = [6, 12] as const;
type Range = (typeof Ranges)[number];

const FlowSeries = [
  { key: 'in', label: 'Invested', color: Series[0] },
  { key: 'out', label: 'Redeemed', color: Series[1] },
] as const;

type FlowPoint = { key: string; label: string; year: string; in: number; out: number };

/** Successful purchases and redemptions per calendar month (IST), oldest first. */
function monthlyFlows(orders: Order[], months: number): FlowPoint[] {
  const now = new Date(Date.now() + 5.5 * 3_600_000);
  const buckets = Array.from({ length: months }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1 - index), 1));
    return {
      key: date.toISOString().slice(0, 7),
      label: date.toLocaleString('en-IN', { month: 'short', timeZone: 'UTC' }),
      year: String(date.getUTCFullYear()),
      in: 0,
      out: 0,
    };
  });
  for (const order of orders) {
    if (stateTone(order.state) !== 'success' || order.kind === 'SWITCH') continue;
    const month = new Date(Date.parse(order.placedAt) + 5.5 * 3_600_000).toISOString().slice(0, 7);
    const bucket = buckets.find((entry) => entry.key === month);
    if (!bucket) continue;
    const amount = num(order.processedAmount ?? order.amount);
    if (order.kind === 'PURCHASE') bucket.in += amount;
    else bucket.out += amount;
  }
  return buckets;
}

/** Axis ceiling and step on a 1 / 2 / 2.5 / 5 grid, so ticks read as round rupee amounts. */
function niceScale(max: number, ticks = 4): { top: number; step: number } {
  const raw = Math.max(max, 1) / ticks;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= raw) ?? raw;
  return { top: step * ticks, step };
}

/** Axis-label rupees: ₹25k, ₹1.5L, ₹2Cr. */
function shortInr(value: number): string {
  const trim = (n: number): string => String(Number(n.toFixed(n < 10 ? 1 : 0)));
  if (value >= 10_000_000) return `₹${trim(value / 10_000_000)}Cr`;
  if (value >= 100_000) return `₹${trim(value / 100_000)}L`;
  if (value >= 1_000) return `₹${trim(value / 1_000)}k`;
  return `₹${Math.round(value)}`;
}

function FlowStat({ label, value, color, tone }: { label: string; value: string; color?: string; tone?: 'success' | 'danger' }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[12px] text-ink-muted">
        {color ? <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: color }} /> : null}
        {label}
      </p>
      <p
        className={cn(
          'tabular mt-1 text-[18px] leading-none font-semibold tracking-[-0.01em]',
          tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-ink',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function FlowsCard({ orders }: { orders: Order[] }): React.JSX.Element {
  const [range, setRange] = useState<Range>(6);
  const [hover, setHover] = useState<number | null>(null);
  const data = monthlyFlows(orders, range);
  const { top, step } = niceScale(Math.max(...data.flatMap((point) => [point.in, point.out])));
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step).reverse();
  const totalIn = data.reduce((sum, point) => sum + point.in, 0);
  const totalOut = data.reduce((sum, point) => sum + point.out, 0);
  const net = totalIn - totalOut;
  const active = hover === null ? null : data[hover];

  return (
    <Card>
      <CardHeader
        title="Money in and out"
        action={
          <div className="flex rounded-md border border-line-strong p-0.5" role="group" aria-label="Range">
            {Ranges.map((months) => (
              <button
                key={months}
                type="button"
                onClick={() => setRange(months)}
                aria-pressed={range === months}
                className={cn(
                  'rounded-[5px] px-2.5 py-0.5 text-[12px] font-medium transition-colors',
                  range === months ? 'bg-ink text-surface' : 'text-ink-muted hover:text-ink',
                )}
              >
                {months}M
              </button>
            ))}
          </div>
        }
      />
      <CardBody className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <FlowStat label="Invested" value={inr(totalIn)} color={FlowSeries[0].color} />
          <FlowStat label="Redeemed" value={inr(totalOut)} color={FlowSeries[1].color} />
          <FlowStat
            label="Net flow"
            value={`${net > 0 ? '+' : net < 0 ? '−' : ''}${inr(Math.abs(net))}`}
            {...(net !== 0 && { tone: net > 0 ? ('success' as const) : ('danger' as const) })}
          />
        </div>

        {totalIn + totalOut === 0 ? (
          <Empty>No completed purchases or redemptions in the last {range} months.</Empty>
        ) : (
          <div className="grid grid-cols-[40px_minmax(0,1fr)]" role="img" aria-label={`Monthly invested and redeemed amounts, last ${range} months`}>
            {/* y axis */}
            <div className="relative h-[184px]">
              {ticks.map((tick) => (
                <span
                  key={tick}
                  className="tabular absolute right-2 -translate-y-1/2 text-[10.5px] text-ink-muted"
                  style={{ top: `${(1 - tick / top) * 100}%` }}
                >
                  {tick === 0 ? '0' : shortInr(tick)}
                </span>
              ))}
            </div>

            {/* plot */}
            <div className="relative h-[184px]">
              {ticks.map((tick) => (
                <div
                  key={tick}
                  className={cn('absolute inset-x-0 border-t', tick === 0 ? 'border-line-strong' : 'border-dashed border-line')}
                  style={{ top: `${(1 - tick / top) * 100}%` }}
                />
              ))}

              <div className="absolute inset-0 flex">
                {data.map((point, index) => {
                  const dim = hover !== null && hover !== index;
                  const empty = point.in === 0 && point.out === 0;
                  return (
                    <div
                      key={point.key}
                      tabIndex={0}
                      aria-label={`${point.label} ${point.year}: invested ${inr(point.in)}, redeemed ${inr(point.out)}`}
                      onPointerEnter={() => setHover(index)}
                      onPointerLeave={() => setHover(null)}
                      onFocus={() => setHover(index)}
                      onBlur={() => setHover(null)}
                      className={cn(
                        'relative flex flex-1 items-end justify-center gap-[2px] rounded-md transition-colors outline-none',
                        hover === index && 'bg-surface-sunken/80',
                      )}
                    >
                      {empty ? (
                        <span className="mb-px h-[3px] w-[40%] max-w-[30px] rounded-full bg-line" />
                      ) : (
                        FlowSeries.map((series) => {
                          const value = point[series.key];
                          return (
                            <span
                              key={series.key}
                              className="w-[30%] max-w-[22px] rounded-t-[4px] transition-[height,opacity] duration-300 ease-out"
                              style={{
                                height: value > 0 ? `max(3px, ${(value / top) * 100}%)` : 0,
                                backgroundColor: series.color,
                                opacity: dim ? 0.35 : 1,
                              }}
                            />
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>

              {active && hover !== null ? (
                <div
                  className={cn(
                    'pointer-events-none absolute top-0 z-10 w-[176px] rounded-lg border border-line bg-surface px-3 py-2.5 shadow-[0_6px_24px_rgba(11,21,36,0.12)]',
                    hover < data.length / 2 ? '' : '-translate-x-full',
                  )}
                  style={{
                    left:
                      hover < data.length / 2
                        ? `calc(${((hover + 1) / data.length) * 100}% + 6px)`
                        : `calc(${(hover / data.length) * 100}% - 6px)`,
                  }}
                >
                  <p className="mb-2 text-[11.5px] font-medium text-ink-muted">
                    {active.label} {active.year}
                  </p>
                  <ul className="space-y-1.5">
                    {FlowSeries.map((series) => (
                      <li key={series.key} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-[12px] text-ink-muted">
                          <span className="h-[2px] w-3 rounded-full" style={{ backgroundColor: series.color }} />
                          {series.label}
                        </span>
                        <span className="tabular text-[13px] font-semibold text-ink">{inr(active[series.key])}</span>
                      </li>
                    ))}
                    <li className="flex items-center justify-between gap-3 border-t border-line pt-1.5">
                      <span className="text-[12px] text-ink-muted">Net</span>
                      <span
                        className={cn(
                          'tabular text-[13px] font-semibold',
                          active.in - active.out > 0 ? 'text-success' : active.in - active.out < 0 ? 'text-danger' : 'text-ink',
                        )}
                      >
                        {active.in - active.out > 0 ? '+' : active.in - active.out < 0 ? '−' : ''}
                        {inr(Math.abs(active.in - active.out))}
                      </span>
                    </li>
                  </ul>
                </div>
              ) : null}
            </div>

            {/* x axis */}
            <div />
            <div className="mt-2 flex">
              {data.map((point, index) => (
                <span
                  key={point.key}
                  className={cn(
                    'flex-1 text-center text-[11px]',
                    hover === index ? 'font-semibold text-ink' : 'text-ink-muted',
                    range === 12 && index % 2 === 1 && 'max-sm:invisible',
                  )}
                >
                  {point.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// --- Invested vs current, per scheme -----------------------------------------------

function SchemeReturnsCard({ portfolio }: { portfolio: InvestorInvestments['portfolio'] }): React.JSX.Element {
  const rows = portfolio.holdings
    .map((holding) => ({
      id: holding.id,
      scheme: holding.scheme,
      invested: num(holding.investedValue),
      current: num(holding.currentValue),
    }))
    .filter((row) => row.invested > 0 || row.current > 0)
    .sort((a, b) => b.current - a.current)
    .slice(0, 6);
  const max = Math.max(1, ...rows.flatMap((row) => [row.invested, row.current]));

  return (
    <Card>
      <CardHeader
        title="Invested vs current"
        action={
          <ul className="flex gap-3">
            <li className="flex items-center gap-1.5 text-[12px] text-ink-soft">
              <span className="size-2.5 rounded-[3px] bg-line-strong" /> Invested
            </li>
            <li className="flex items-center gap-1.5 text-[12px] text-ink-soft">
              <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: Series[0] }} /> Current
            </li>
          </ul>
        }
      />
      <CardBody>
        {rows.length === 0 ? (
          <Empty>No units held yet.</Empty>
        ) : (
          <ul className="space-y-3.5">
            {rows.map((row) => {
              const gain = row.invested ? ((row.current - row.invested) / row.invested) * 100 : 0;
              return (
                <li key={row.id} title={`${row.scheme}: invested ${inr(row.invested)}, now ${inr(row.current)}`}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-[12.5px]">
                    <span className="truncate text-ink-soft">{row.scheme}</span>
                    <span className="tabular shrink-0">
                      <span className="font-semibold text-ink">{inr(row.current)}</span>
                      {row.invested ? (
                        <span className={cn('ml-2 font-medium', gain >= 0 ? 'text-success' : 'text-danger')}>
                          {gain >= 0 ? '▲' : '▼'} {Math.abs(gain).toFixed(1)}%
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <div className="space-y-[2px]">
                    <div className="h-1.5 rounded-r-full bg-line-strong" style={{ width: `${(row.invested / max) * 100}%` }} />
                    <div className="h-1.5 rounded-r-full" style={{ width: `${(row.current / max) * 100}%`, backgroundColor: Series[0] }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

// --- SIP progress ------------------------------------------------------------------

function ProgressRing({ done, total, failed }: { done: number; total: number; failed: number }): React.JSX.Element {
  const size = 56;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total ? Math.min(1, done / total) : 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-surface-sunken)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={failed > 0 ? 'var(--color-warn)' : Series[0]}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${pct * circumference} ${circumference}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" className="tabular fill-[var(--color-ink)] text-[12px] font-semibold">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

function SipProgressCard({ sips }: { sips: Plan[] }): React.JSX.Element {
  const shown = sips.filter((plan) => plan.totalInstallments > 0).slice(0, 6);

  return (
    <Card>
      <CardHeader title="SIP progress" />
      <CardBody>
        {shown.length === 0 ? (
          <Empty>No SIPs set up.</Empty>
        ) : (
          <ul className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
            {shown.map((plan) => {
              const failed = plan.installmentsPlaced - plan.installmentsSucceeded;
              return (
                <li key={plan.id} className="flex items-center gap-3">
                  <ProgressRing done={plan.installmentsSucceeded} total={plan.totalInstallments} failed={failed} />
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-[12.5px] leading-snug font-medium text-ink" title={plan.scheme}>
                      {plan.scheme}
                    </span>
                    <span className="tabular block text-[12px] text-ink-muted">
                      {plan.installmentsSucceeded} of {plan.totalInstallments}
                      {plan.amount ? ` · ${inr(num(plan.amount))}` : ''}
                    </span>
                    {failed > 0 ? <span className="block text-[11.5px] text-warn">{failed} missed</span> : null}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

// --- Composition -------------------------------------------------------------------

export function OverviewCharts({ investments }: { investments: InvestorInvestments }): React.JSX.Element {
  const { portfolio, orders, plans } = investments;

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <AllocationCard portfolio={portfolio} />
        <OutcomesCard orders={orders} />
      </div>
      <FlowsCard orders={orders} />
      <div className="grid gap-4 lg:grid-cols-2">
        <SchemeReturnsCard portfolio={portfolio} />
        <SipProgressCard sips={plans.sips} />
      </div>
    </>
  );
}

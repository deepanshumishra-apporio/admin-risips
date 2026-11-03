'use client';

import { useId, useMemo, useRef, useState } from 'react';

import type { HufNavPoint } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

const Ranges = [
  { key: '1M', months: 1 }, { key: '3M', months: 3 }, { key: '6M', months: 6 }, { key: '1Y', months: 12 },
  { key: '3Y', months: 36 }, { key: '5Y', months: 60 }, { key: 'All', months: 0 },
] as const;
type RangeKey = (typeof Ranges)[number]['key'];

const Width = 800;
const Height = 260;
const Pad = { top: 14, right: 64, bottom: 28, left: 8 };

const monthsBefore = (iso: string, months: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
};
const dateText = (iso: string, long = false) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { day: long ? 'numeric' : undefined, month: 'short', year: long ? 'numeric' : '2-digit', timeZone: 'UTC' });
const navText = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;

/** Three to five round levels across [min, max]. */
function ticks(min: number, max: number): number[] {
  const span = max - min || Math.abs(max) || 1;
  const raw = span / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(Number(v.toFixed(6)));
  return out;
}

export type ChartMarker = { date: string; label: string };

/**
 * A fund's NAV over a chosen range, with the change over it, a crosshair that reads off any day, and the HUF's own
 * purchases marked on the line.
 */
export function NavChart({ points, markers = [], initial = '1Y' }: { points: HufNavPoint[]; markers?: ChartMarker[]; initial?: RangeKey }): React.JSX.Element {
  const gradient = useId();
  const svg = useRef<SVGSVGElement>(null);
  const last = points.at(-1);
  const first = points[0];
  const available = Ranges.filter((r) => r.months === 0 || (first && last && first[0] <= monthsBefore(last[0], r.months)) || r.key === '1M');
  const [range, setRange] = useState<RangeKey>(available.some((r) => r.key === initial) ? initial : available.at(-1)?.key ?? 'All');
  const [hover, setHover] = useState<number | null>(null);

  const shown = useMemo(() => {
    const r = Ranges.find((x) => x.key === range)!;
    if (!last || r.months === 0) return points;
    const from = monthsBefore(last[0], r.months);
    const i = points.findIndex((p) => p[0] >= from);
    // Start from the day before the range, so the change is measured from a NAV that existed then.
    return points.slice(Math.max(0, i - 1));
  }, [points, range, last]);

  if (shown.length < 2) {
    return <p className="py-10 text-center text-[13px] text-ink-muted">Not enough NAV history to draw a chart.</p>;
  }

  const navs = shown.map((p) => p[1]);
  const lo = Math.min(...navs);
  const hi = Math.max(...navs);
  const padY = (hi - lo) * 0.08 || hi * 0.02 || 1;
  const yMin = Math.max(0, lo - padY);
  const yMax = hi + padY;
  const t0 = Date.parse(shown[0]![0]);
  const t1 = Date.parse(shown.at(-1)![0]);
  const plotW = Width - Pad.left - Pad.right;
  const plotH = Height - Pad.top - Pad.bottom;
  const x = (iso: string) => Pad.left + ((Date.parse(iso) - t0) / Math.max(1, t1 - t0)) * plotW;
  const y = (nav: number) => Pad.top + (1 - (nav - yMin) / (yMax - yMin)) * plotH;

  const line = shown.map((p, i) => `${i ? 'L' : 'M'}${x(p[0]).toFixed(1)} ${y(p[1]).toFixed(1)}`).join(' ');
  const area = `${line} L${x(shown.at(-1)![0]).toFixed(1)} ${Pad.top + plotH} L${Pad.left} ${Pad.top + plotH} Z`;
  const change = (shown.at(-1)![1] / shown[0]![1] - 1) * 100;
  const up = change >= 0;
  const color = up ? 'var(--color-success)' : 'var(--color-danger)';
  const yTicks = ticks(yMin, yMax);
  const xTicks = Array.from({ length: 5 }, (_, i) => shown[Math.round((i / 4) * (shown.length - 1))]![0]);
  const inRange = markers.filter((m) => m.date >= shown[0]![0] && m.date <= shown.at(-1)![0]);
  const navAt = (iso: string) => {
    const p = shown.findLast((q) => q[0] <= iso) ?? shown[0]!;
    return p[1];
  };

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const box = svg.current?.getBoundingClientRect();
    if (!box) return;
    const px = ((e.clientX - box.left) / box.width) * Width;
    const t = t0 + ((px - Pad.left) / plotW) * (t1 - t0);
    let best = 0;
    for (let i = 1; i < shown.length; i++) if (Math.abs(Date.parse(shown[i]![0]) - t) < Math.abs(Date.parse(shown[best]![0]) - t)) best = i;
    setHover(best);
  };
  const h = hover === null ? null : shown[hover]!;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="tabular text-[22px] leading-none font-semibold tracking-[-0.01em] text-ink">{navText(h ? h[1] : shown.at(-1)![1])}</p>
          <p className="mt-1.5 text-[12.5px] text-ink-muted">
            {h ? (
              <>NAV on {dateText(h[0], true)}</>
            ) : (
              <>
                <span className={cn('tabular font-semibold', up ? 'text-success' : 'text-danger')}>
                  {up ? '+' : ''}
                  {change.toFixed(2)}%
                </span>{' '}
                over {range === 'All' ? `since ${dateText(shown[0]![0], true)}` : range.replace('M', ' month').replace('Y', ' year')}
                {range !== 'All' && !/^1[MY]$/.test(range) ? 's' : ''} · NAV on {dateText(shown.at(-1)![0], true)}
              </>
            )}
          </p>
        </div>
        <div role="tablist" aria-label="Chart range" className="flex gap-1 rounded-lg bg-surface-sunken p-1">
          {available.map((r) => (
            <button
              key={r.key}
              type="button"
              role="tab"
              aria-selected={range === r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                'rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors',
                range === r.key ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink',
              )}
            >
              {r.key}
            </button>
          ))}
        </div>
      </div>

      <svg
        ref={svg}
        viewBox={`0 0 ${Width} ${Height}`}
        className="w-full touch-none select-none"
        role="img"
        aria-label={`NAV over ${range}: ${up ? 'up' : 'down'} ${Math.abs(change).toFixed(2)}%`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={Pad.left} x2={Width - Pad.right} y1={y(v)} y2={y(v)} stroke="var(--color-line)" strokeDasharray="3 5" />
            <text x={Width - Pad.right + 8} y={y(v) + 4} className="fill-[var(--color-ink-muted)] text-[11px] tabular-nums">
              {v.toLocaleString('en-IN', { maximumFractionDigits: v < 10 ? 2 : 0 })}
            </text>
          </g>
        ))}
        {xTicks.map((d, i) => (
          <text key={`${d}-${i}`} x={x(d)} y={Height - 8} textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'} className="fill-[var(--color-ink-muted)] text-[11px]">
            {dateText(d)}
          </text>
        ))}
        <path d={area} fill={`url(#${gradient})`} />
        <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {inRange.map((m) => (
          <g key={`${m.date}-${m.label}`}>
            <circle cx={x(m.date)} cy={y(navAt(m.date))} r={4.5} fill="var(--color-brand)" stroke="var(--color-surface)" strokeWidth={2} />
            <title>{`${dateText(m.date, true)}: ${m.label}`}</title>
          </g>
        ))}
        {h ? (
          <g pointerEvents="none">
            <line x1={x(h[0])} x2={x(h[0])} y1={Pad.top} y2={Pad.top + plotH} stroke="var(--color-ink-muted)" strokeOpacity={0.45} />
            <circle cx={x(h[0])} cy={y(h[1])} r={4.5} fill={color} stroke="var(--color-surface)" strokeWidth={2} />
          </g>
        ) : null}
      </svg>
      {inRange.length ? (
        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-muted">
          <span className="inline-block size-2.5 rounded-full bg-brand" /> The HUF&apos;s purchases in this range ({inRange.length})
        </p>
      ) : null}
    </div>
  );
}

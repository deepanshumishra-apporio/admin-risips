import type { SeriesPoint } from '@/types/chart.types';

type AreaChartProps = {
  data: SeriesPoint[];
  color?: string;
  height?: number;
  valueFormatter?: (value: number) => string;
};

const Width = 640;
const PaddingX = 8;

/** Dependency-free SVG area chart — SIP inflow over the selected range. */
export function AreaChart({
  data,
  color = 'var(--color-brand)',
  height = 220,
  valueFormatter,
}: AreaChartProps): React.JSX.Element {
  // Floor of 1 keeps an all-zero series on the baseline instead of dividing by zero.
  const max = Math.max(1, ...data.map((point) => point.value)) * 1.15;
  const min = 0;
  const stepX = (Width - PaddingX * 2) / Math.max(1, data.length - 1);
  const plotHeight = height - 34;

  const toX = (index: number): number => PaddingX + index * stepX;
  const toY = (value: number): number => plotHeight - ((value - min) / (max - min)) * (plotHeight - 12) - 6;

  const line = data.map((point, index) => `${index === 0 ? 'M' : 'L'} ${toX(index)} ${toY(point.value)}`).join(' ');
  const area = `${line} L ${toX(data.length - 1)} ${plotHeight} L ${toX(0)} ${plotHeight} Z`;

  return (
    <svg viewBox={`0 0 ${Width} ${height}`} className="w-full" role="img" aria-label="Fund flow trend">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
        <line
          key={ratio}
          x1={0}
          x2={Width}
          y1={6 + ratio * (plotHeight - 12)}
          y2={6 + ratio * (plotHeight - 12)}
          stroke="var(--color-line)"
          strokeDasharray="3 5"
        />
      ))}

      <path d={area} fill="url(#areaFill)" />
      <path d={line} fill="none" stroke={color} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />

      {data.map((point, index) => (
        <g key={point.label}>
          <circle cx={toX(index)} cy={toY(point.value)} r={3} fill="var(--color-surface)" stroke={color} strokeWidth={2} />
          <text x={toX(index)} y={height - 8} textAnchor="middle" className="fill-[var(--color-ink-muted)] text-[11px]">
            {point.label}
          </text>
          {valueFormatter ? (
            <title>{`${point.label}: ${valueFormatter(point.value)}`}</title>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

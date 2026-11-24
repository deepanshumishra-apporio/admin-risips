type Series = { key: string; label: string; color: string };

type LineChartProps = {
  labels: string[];
  series: Series[];
  values: Record<string, number[]>;
  height?: number;
  valueFormatter?: (value: number) => string;
  /** Drawing width: smaller for a narrow card, so the labels stay readable. */
  width?: number;
};

const PaddingX = 16;

/** Several series as lines over the same labels (e.g. SIP against lumpsum money each month). */
export function LineChart({ labels, series, values, height = 150, valueFormatter = String, width: Width = 640 }: LineChartProps): React.JSX.Element {
  const max = Math.max(1, ...series.flatMap((s) => values[s.key] ?? [])) * 1.15;
  const plotHeight = height - 26;
  const stepX = (Width - PaddingX * 2) / Math.max(1, labels.length - 1);
  const toX = (i: number) => PaddingX + i * stepX;
  const toY = (v: number) => plotHeight - (v / max) * (plotHeight - 8);

  return (
    <svg viewBox={`0 0 ${Width} ${height}`} className="w-full" role="img" aria-label={series.map((s) => s.label).join(' against ')}>
      {[0, 0.5, 1].map((ratio) => (
        <line key={ratio} x1={0} x2={Width} y1={8 + ratio * (plotHeight - 8)} y2={8 + ratio * (plotHeight - 8)} stroke="var(--color-line)" strokeDasharray="3 5" />
      ))}
      {series.map((s) => {
        const points = values[s.key] ?? [];
        const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`).join(' ');
        return (
          <g key={s.key}>
            <path d={d} fill="none" stroke={s.color} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
            {points.map((v, i) => (
              <circle key={i} cx={toX(i)} cy={toY(v)} r={3} fill="var(--color-surface)" stroke={s.color} strokeWidth={2}>
                <title>{`${labels[i]} · ${s.label}: ${valueFormatter(v)}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
      {labels.map((label, i) => (
        <text key={label} x={toX(i)} y={height - 6} textAnchor="middle" className="fill-[var(--color-ink-muted)] text-[11px]">
          {label}
        </text>
      ))}
    </svg>
  );
}

type Series = { key: string; label: string; color: string };

type GroupedBarChartProps = {
  labels: string[];
  series: Series[];
  /** values[seriesKey][i] for labels[i]. */
  values: Record<string, number[]>;
  height?: number;
  valueFormatter?: (value: number) => string;
  /** Drawing width: smaller for a narrow card, so the labels stay readable. */
  width?: number;
};

/** Bars side by side per label, one per series (e.g. SIPs started and running each month). */
export function GroupedBarChart({ labels, series, values, height = 180, valueFormatter = String, width: Width = 640 }: GroupedBarChartProps): React.JSX.Element {
  const max = Math.max(1, ...series.flatMap((s) => values[s.key] ?? [])) * 1.15;
  const plotHeight = height - 26;
  const slot = Width / Math.max(1, labels.length);
  const gap = 4;
  const barWidth = Math.min(22, (slot * 0.6 - gap * (series.length - 1)) / series.length);
  const groupWidth = barWidth * series.length + gap * (series.length - 1);

  return (
    <svg viewBox={`0 0 ${Width} ${height}`} className="w-full" role="img" aria-label={series.map((s) => s.label).join(' and ')}>
      {[0, 0.5, 1].map((ratio) => (
        <line key={ratio} x1={0} x2={Width} y1={4 + ratio * (plotHeight - 4)} y2={4 + ratio * (plotHeight - 4)} stroke="var(--color-line)" strokeDasharray="3 5" />
      ))}
      {labels.map((label, i) => {
        const x0 = i * slot + (slot - groupWidth) / 2;
        return (
          <g key={label}>
            {series.map((s, j) => {
              const value = values[s.key]?.[i] ?? 0;
              const h = (value / max) * (plotHeight - 4);
              return (
                <rect key={s.key} x={x0 + j * (barWidth + gap)} y={plotHeight - h} width={barWidth} height={Math.max(value > 0 ? 2 : 0, h)} rx={3} fill={s.color}>
                  <title>{`${label} · ${s.label}: ${valueFormatter(value)}`}</title>
                </rect>
              );
            })}
            <text x={i * slot + slot / 2} y={height - 6} textAnchor="middle" className="fill-[var(--color-ink-muted)] text-[11px]">
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

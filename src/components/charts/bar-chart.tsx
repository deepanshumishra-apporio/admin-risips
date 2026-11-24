type Bar = { label: string; value: number; color?: string; title?: string };

type BarChartProps = {
  data: Bar[];
  color?: string;
  height?: number;
};

const Width = 640;

/** One bar per label; a bar can carry its own colour (e.g. the current month). */
export function BarChart({ data, color = 'var(--color-brand)', height = 220 }: BarChartProps): React.JSX.Element {
  const max = Math.max(1, ...data.map((d) => d.value)) * 1.1;
  const plotHeight = height - 26;
  const slot = Width / Math.max(1, data.length);
  const barWidth = Math.min(36, slot * 0.62);

  return (
    <svg viewBox={`0 0 ${Width} ${height}`} className="w-full" role="img" aria-label="Bar chart">
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
        <line key={ratio} x1={0} x2={Width} y1={4 + ratio * (plotHeight - 4)} y2={4 + ratio * (plotHeight - 4)} stroke="var(--color-line)" strokeDasharray="3 5" />
      ))}
      {data.map((d, i) => {
        const h = (d.value / max) * (plotHeight - 4);
        const x = i * slot + (slot - barWidth) / 2;
        return (
          <g key={d.label}>
            <rect x={x} y={plotHeight - h} width={barWidth} height={Math.max(d.value > 0 ? 2 : 0, h)} rx={3} fill={d.color ?? color}>
              {d.title ? <title>{d.title}</title> : null}
            </rect>
            <text x={x + barWidth / 2} y={height - 6} textAnchor="middle" className="fill-[var(--color-ink-muted)] text-[11px]">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

import { InfoHint } from '@/features/dashboard/components/info-hint';
import { cn } from '@/utils/cn';

export type Metric = {
  label: string;
  value: string;
  /** A short line under the number. */
  caption?: string;
  /** What the number counts, shown on hover. */
  hint?: string;
  href?: string;
};

/** One row of headline numbers under a small section title (Business, Investor, Support metrics). */
export function MetricSection({ title, metrics, columns = 3 }: { title?: string; metrics: Metric[]; columns?: 2 | 3 | 4 }): React.JSX.Element {
  return (
    <section>
      {title ? <h2 className="mb-2.5 text-[15px] font-semibold tracking-[-0.01em] text-ink">{title}</h2> : null}
      <div className={cn('grid grid-cols-1 gap-4', columns === 4 ? 'sm:grid-cols-2 xl:grid-cols-4' : columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>
    </section>
  );
}

function MetricCard({ metric }: { metric: Metric }): React.JSX.Element {
  const body = (
    <>
      <p className="flex items-center gap-1.5 text-[13px] text-ink-soft">
        {metric.label}
        {metric.hint ? <InfoHint text={metric.hint} /> : null}
        {metric.href ? <ArrowUpRight aria-hidden className="ml-auto size-4 text-ink-muted transition-colors group-hover:text-brand" /> : null}
      </p>
      <p className="tabular mt-2 text-[26px] leading-none font-semibold tracking-[-0.02em] text-ink">{metric.value}</p>
      {metric.caption ? <p className="mt-2 text-[12px] text-ink-muted">{metric.caption}</p> : null}
    </>
  );
  const box = 'block rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3.5';
  return metric.href ? (
    <Link href={metric.href} className={cn(box, 'group transition-colors hover:border-brand/40 hover:bg-surface-sunken')}>
      {body}
    </Link>
  ) : (
    <div className={box}>{body}</div>
  );
}

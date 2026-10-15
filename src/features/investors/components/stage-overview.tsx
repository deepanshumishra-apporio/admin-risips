import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { BlankFilters, investorsHref, sameView, type InvestorFilters } from '@/features/investors/search-params';
import { Buckets, type Bucket } from '@/features/investors/stages';
import type { InvestorOverview } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatCount } from '@/utils/format';

const percent = (count: number, total: number) => (total > 0 ? Math.round((count / total) * 100) : 0);

/** "Where investors are": the five steps as one bar, and a card for each that filters the list. */
export function StageOverview({ overview, filters }: { overview: InvestorOverview; filters: InvestorFilters }): React.JSX.Element {
  const counts = Buckets.map((bucket) => bucket.stages.reduce((sum, stage) => sum + (overview.byStage[stage] ?? 0), 0));
  const sipDueView = { ...BlankFilters, q: filters.q, sipDue: 7 };

  /** The line under each card's number: a next step where there is one. */
  const footnote = (bucket: Bucket, count: number): React.JSX.Element => {
    const link = (label: string, change: Partial<InvestorFilters>) => (
      <Link
        href={investorsHref({ ...BlankFilters, q: filters.q, ...change })}
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:text-brand-deep"
      >
        {label}
        <ArrowRight className="size-3.5" />
      </Link>
    );
    const note = (text: string) => <span className="text-[12.5px] text-ink-muted">{text}</span>;

    switch (bucket.key) {
      case 'signed-up':
        return note("Didn't start KYC");
      case 'kyc':
        return overview.attention.KYC > 0
          ? link(`${formatCount(overview.attention.KYC)} need attention`, overview.countedFromList ? { stage: ['KYC'] } : { attention: 'KYC' })
          : note('All moving');
      case 'not-ready':
        return overview.attention.SETUP > 0
          ? link(`${formatCount(overview.attention.SETUP)} need attention`, overview.countedFromList ? { stage: ['ACCOUNT_SETUP'] } : { attention: 'SETUP' })
          : note('Finishing their profile');
      case 'ready':
        return count > 0 ? link(`Nudge ${formatCount(count)}`, { stage: bucket.stages }) : note('Nobody waiting');
      default:
        return overview.activeSips === null
          ? note('Money working with us')
          : note(`${formatCount(overview.activeSips)} active ${overview.activeSips === 1 ? 'SIP' : 'SIPs'}`);
    }
  };

  return (
    <Card className="mb-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink">Where investors are</h2>
          <p className="mt-1 text-[13px] text-ink-muted">
            {formatCount(overview.total)} investors, by the furthest step each has reached. Pick a stage to filter the list.
          </p>
        </div>
        <Link
          href={investorsHref(sipDueView)}
          className={cn(
            'rounded-full border px-3 py-1 text-[12.5px] font-semibold transition-colors',
            sameView(filters, sipDueView) ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line bg-surface-sunken text-ink-soft hover:text-ink',
          )}
        >
          SIP due in 7 days · {formatCount(overview.sipDueIn7Days)}
        </Link>
      </div>

      {/* One bar, each step as wide as its share; an empty step keeps a sliver so the order still reads. */}
      <div className="mt-5 flex h-2.5 gap-0.5 overflow-hidden rounded-sm" aria-hidden="true">
        {Buckets.map((bucket, index) => (
          <span
            key={bucket.key}
            style={{ flexGrow: Math.max(counts[index] ?? 0, overview.total * 0.02), backgroundColor: bucket.color }}
            className="min-w-1"
          />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {Buckets.map((bucket, index) => {
          const count = counts[index] ?? 0;
          const view = { ...BlankFilters, q: filters.q, stage: bucket.stages };
          const active = sameView(filters, view);
          return (
            <div
              key={bucket.key}
              className={cn(
                'relative rounded-lg border p-4 transition-colors',
                active ? 'border-brand bg-brand-soft' : 'border-line hover:border-line-strong hover:bg-surface-sunken',
              )}
            >
              {/* The whole card filters; the footnote's link sits above it and goes to its own view. */}
              <Link href={investorsHref(view)} className="absolute inset-0 rounded-lg" aria-label={`Show ${bucket.label.toLowerCase()}`} />
              <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
                <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: bucket.color }} />
                {bucket.label}
              </p>
              <p className="mt-2.5 flex items-baseline gap-1.5">
                <span className="tabular text-[26px] leading-none font-semibold text-ink">{formatCount(count)}</span>
                <span className="tabular text-[12px] text-ink-muted">{percent(count, overview.total)}%</span>
              </p>
              <div className="relative mt-2.5">{footnote(bucket, count)}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

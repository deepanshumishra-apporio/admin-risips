import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { fundName, fundTags } from '@/features/hufs/components/fund-explorer';
import { inr } from '@/features/hufs/portfolio';
import type { HufNavHistory, HufScheme } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

export const pct = (n: number | null | undefined) => (n === null || n === undefined ? '—' : `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`);
export const pctTone = (n: number | null | undefined) => (n === null || n === undefined ? 'text-ink-muted' : n >= 0 ? 'text-success' : 'text-danger');

/** The fund's returns over each period it is old enough for: absolute up to a year, yearly compounded beyond. */
export function ReturnsGrid({ history, keys, compact = false }: { history: HufNavHistory | null; keys?: string[]; compact?: boolean }): React.JSX.Element {
  const periods = (history?.returns.periods ?? []).filter((p) => !keys || keys.includes(p.key));
  if (!periods.length) return <p className="text-[12.5px] text-ink-muted">{history?.error ?? 'Returns aren’t available for this fund.'}</p>;
  return (
    <dl className={cn('grid gap-2', compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4 xl:grid-cols-7')}>
      {periods.map((p) => (
        <div key={p.key} className="rounded-lg bg-surface-sunken px-3 py-2.5">
          <dt className="text-[11.5px] text-ink-muted">
            {compact ? p.key : p.label}
            {p.annualised ? <span className="text-ink-muted/70">{compact ? ' a yr' : ' · a year'}</span> : null}
          </dt>
          <dd className={cn('tabular mt-0.5 text-[14px] font-semibold', pctTone(p.percent))}>{pct(p.percent)}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The fund in a few lines, beside an investment's steps. */
export function FundSummary({ scheme, history, href }: { scheme: HufScheme; history: HufNavHistory | null; href: string }): React.JSX.Element {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <p className="text-[12px] text-ink-muted">{scheme.amcName}</p>
      <p className="mt-0.5 text-[14px] leading-snug font-semibold text-ink">{fundName(scheme)}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {scheme.assetClass ? <Badge tone="brand">{scheme.assetClass}</Badge> : null}
        <Badge tone="neutral">{fundTags(scheme)}</Badge>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-[13px]">
        <div>
          <dt className="text-[11.5px] text-ink-muted">NAV</dt>
          <dd className="tabular font-semibold text-ink">{scheme.nav ? `₹${scheme.nav.toLocaleString('en-IN', { maximumFractionDigits: 4 })}` : '—'}</dd>
        </div>
        <div>
          <dt className="text-[11.5px] text-ink-muted">First purchase from</dt>
          <dd className="tabular font-semibold text-ink">{inr(scheme.minFresh)}</dd>
        </div>
        <div>
          <dt className="text-[11.5px] text-ink-muted">Monthly SIP</dt>
          <dd className="tabular font-semibold text-ink">{scheme.sipMonthly ? `from ${inr(scheme.sipMonthly.minAmount)}` : 'Not offered'}</dd>
        </div>
        <div>
          <dt className="text-[11.5px] text-ink-muted">Exit load</dt>
          <dd className="font-semibold break-words text-ink">{scheme.exitLoad ?? '—'}</dd>
        </div>
      </dl>
      <div className="mt-4 border-t border-line pt-4">
        <p className="mb-2 text-[11.5px] font-semibold tracking-[0.04em] text-ink-muted uppercase">Returns</p>
        <ReturnsGrid history={history} keys={['1Y', '3Y', '5Y']} compact />
      </div>
      <Link href={href} className="mt-4 inline-block text-[12.5px] font-semibold text-brand hover:text-brand-deep">
        Chart and everything about this fund
      </Link>
    </div>
  );
}

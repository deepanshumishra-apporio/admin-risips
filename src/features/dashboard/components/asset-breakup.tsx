import Link from 'next/link';

import { Card, CardBody, CardHeader } from '@/components/ui/card';
import type { AssetClassKey, DashboardOverview } from '@/types/admin-api.types';
import { formatInrString, formatPercent } from '@/utils/format';

export const AssetClassColor: Record<AssetClassKey, string> = {
  EQUITY: 'var(--color-brand)',
  HYBRID: 'var(--color-success)',
  DEBT: 'var(--color-amber)',
  OTHER: 'var(--color-violet)',
};

/** AUM by asset class, from the last holdings valuation, with one bar showing the allocation. */
export function AssetBreakup({ classes }: { classes: DashboardOverview['assetClasses'] }): React.JSX.Element {
  const empty = classes.every((c) => Number(c.value) === 0);
  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Asset-wise breakup"
        subtitle="Current value by fund category"
        action={<Link href="/orders/aum" className="text-[13px] font-semibold text-brand hover:underline">View AUM</Link>}
      />
      <CardBody className="flex flex-1 flex-col">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[12px] text-ink-muted">
              <th className="pb-2 font-medium">Asset class</th>
              <th className="pb-2 text-right font-medium">AUM</th>
              <th className="pb-2 text-right font-medium">Allocation</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.key} className="border-t border-line hover:bg-surface-sunken">
                <td className="py-2">
                  <Link href={`/orders/aum?assetClass=${c.key}`} className="flex items-center gap-2 text-ink hover:text-brand">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: AssetClassColor[c.key] }} />
                    {c.label}
                  </Link>
                </td>
                <td className="tabular py-2 text-right font-medium text-ink">{formatInrString(c.value)}</td>
                <td className="tabular py-2 text-right text-ink-soft">{formatPercent(c.share, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-auto pt-4">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-sunken" role="img" aria-label="Allocation by asset class">
            {empty
              ? null
              : classes.map((c) =>
                  c.share > 0 ? <span key={c.key} style={{ width: `${c.share}%`, backgroundColor: AssetClassColor[c.key] }} /> : null,
                )}
          </div>
          {empty ? <p className="mt-2 text-[12px] text-ink-muted">No holdings valued yet.</p> : null}
        </div>
      </CardBody>
    </Card>
  );
}

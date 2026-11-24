import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import type { DashboardOverview } from '@/types/admin-api.types';
import { formatInrString } from '@/utils/format';

const Status = {
  ACTIVE: { label: 'Active', tone: 'success' },
  INACTIVE: { label: 'Inactive', tone: 'neutral' },
  DELETION_REQUESTED: { label: 'Deletion requested', tone: 'danger' },
} as const;

/** The five newest sign-ups. */
export function RecentInvestors({ investors }: { investors: DashboardOverview['recentInvestors'] }): React.JSX.Element {
  return (
    <Card>
      <CardHeader
        title="Recent investors"
        action={
          <Link href="/investors" className="text-[13px] font-semibold text-brand hover:underline">
            View all
          </Link>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-[13px]">
          <thead>
            <tr className="text-left text-[12px] text-ink-muted">
              <th className="px-4 py-2 font-medium">Investor</th>
              <th className="px-4 py-2 font-medium">PAN</th>
              <th className="px-4 py-2 font-medium">Folio</th>
              <th className="px-4 py-2 text-right font-medium">AUM</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {investors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-muted">
                  No investors yet.
                </td>
              </tr>
            ) : (
              investors.map((investor) => {
                const status = Status[investor.status];
                return (
                  <tr key={investor.id} className="border-t border-line">
                    <td className="px-4 py-2.5">
                      <Link href={`/investors/${investor.id}`} className="font-medium text-ink hover:text-brand">
                        {investor.name || 'No name yet'}
                      </Link>
                    </td>
                    <td className="tabular px-4 py-2.5 text-ink-soft">{investor.pan ?? '—'}</td>
                    <td className="tabular px-4 py-2.5 text-ink-soft">{investor.folio ?? '—'}</td>
                    <td className="tabular px-4 py-2.5 text-right font-medium text-ink">{formatInrString(investor.aum)}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

import Link from 'next/link';

import { Card, CardHeader } from '@/components/ui/card';
import type { DashboardOverview } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatCount } from '@/utils/format';

type Row = { label: string; count: number; action: string; href: string };

/** The queues to work today, each opening the list it counts. Rows this staff member can't open are left out. */
export function NeedsAttention({ queues }: { queues: DashboardOverview['queues'] }): React.JSX.Element {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000 - 30 * 86_400_000).toISOString().slice(0, 10);
  const rows: Row[] = [
    {
      label: 'Failed SIP debits, last 30 days',
      count: queues.failedSipDebits,
      action: 'Review',
      href: `/transactions?type=SIP_INSTALLMENT&state=FAILED&from=${ist}`,
    },
    { label: 'Investor KYC pending', count: queues.kycPending, action: 'Review', href: '/investors?kyc=NOT_STARTED,IN_PROGRESS' },
  ];
  if (queues.flaggedTransactions !== null) {
    rows.push({ label: 'Flagged transactions', count: queues.flaggedTransactions, action: 'Investigate', href: '/transactions?attention=true' });
  }

  return (
    <Card>
      <CardHeader title="Needs attention" />
      <ul className="divide-y divide-line">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1 text-[13.5px] text-ink">
              {row.label}{' '}
              <span className={cn('tabular font-semibold', row.count > 0 ? 'text-danger' : 'text-ink-muted')}>[{formatCount(row.count)}]</span>
            </span>
            <Link href={row.href} className="text-[13px] font-semibold text-brand underline-offset-2 hover:underline">
              {row.action}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

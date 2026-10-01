import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { Card, CardHeader } from '@/components/ui/card';
import type { DashboardSummary } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatCount } from '@/utils/format';

type Row = { label: string; detail: string; count: number; href: string; severe?: boolean };

/** The queues someone should work today, each opening the investor list already filtered. */
export function AttentionPanel({ attention }: { attention: DashboardSummary['attention'] }): React.JSX.Element {
  const rows: Row[] = [
    {
      label: 'KYC stalled',
      detail: 'An open KYC form with no progress for 48 hours',
      count: attention.kycStalled,
      href: '/investors?stalled=true',
      severe: true,
    },
    {
      label: 'KYC failed or expired',
      detail: 'The investor needs to start a new KYC form',
      count: attention.kycFailedOrExpired,
      href: '/investors?kyc=FAILED,EXPIRED',
      severe: true,
    },
    {
      label: 'PAN check not passed',
      detail: 'Usually not KRA-compliant yet; a KYC form is owed',
      count: attention.panCheckFailed,
      href: '/investors?kyc=PAN_CHECK_FAILED',
    },
    {
      label: 'Account not ready',
      detail: 'Account created, but cannot transact yet',
      count: attention.accountNotReady,
      href: '/investors?stage=ACCOUNT_SETUP',
    },
  ];

  return (
    <Card>
      <CardHeader title="Needs attention" subtitle="Investors who are stuck, by reason" />
      <ul className="divide-y divide-line">
        {rows.map((row) => (
          <li key={row.label}>
            <Link href={row.href} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-sunken">
              <span
                className={cn(
                  'tabular flex h-7 min-w-9 items-center justify-center rounded-md px-2 text-[13px] font-semibold',
                  row.count === 0
                    ? 'bg-surface-sunken text-ink-muted'
                    : row.severe
                      ? 'bg-danger-soft text-danger'
                      : 'bg-warn-soft text-warn',
                )}
              >
                {formatCount(row.count)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-medium text-ink group-hover:text-brand">{row.label}</span>
                <span className="block text-[12px] text-ink-muted">{row.detail}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-ink-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

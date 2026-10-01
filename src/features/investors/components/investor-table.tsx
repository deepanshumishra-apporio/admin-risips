import { Users } from 'lucide-react';
import Link from 'next/link';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, Td } from '@/components/ui/table';
import { KycLabel, NextStepLabel, StageLabel } from '@/features/investors/labels';
import type { InvestorListItem } from '@/types/admin-api.types';
import { formatDate, formatInrString, timeAgo } from '@/utils/format';
import { JourneyStageTone, KycStatusTone } from '@/utils/tone';

const Headers = ['Investor', 'Stage', 'KYC', 'Current value', 'SIPs', 'Next SIP', 'Last active'] as const;

/** Days from today (India) to a yyyy-mm-dd date. */
function daysUntil(date: string): number {
  const today = Date.parse(new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10));
  return Math.round((Date.parse(date) - today) / 86_400_000);
}

export function InvestorTable({ investors }: { investors: InvestorListItem[] }): React.JSX.Element {
  if (investors.length === 0) {
    return (
      <EmptyState
        icon={<Users className="size-5" />}
        title="No investors match"
        description="Try a different search, or clear the filters."
      />
    );
  }

  return (
    <Table headers={Headers}>
      {investors.map((investor) => {
        const name = investor.name ?? 'Unnamed investor';
        const value = Number(investor.currentValue);
        const due = investor.nextSipDate ? daysUntil(investor.nextSipDate) : null;
        return (
          <tr key={investor.id} className="group transition-colors hover:bg-surface-sunken">
            <Td>
              <Link href={`/investors/${investor.id}`} className="flex items-center gap-2.5">
                <Avatar name={name} tone="violet" />
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-semibold text-ink group-hover:text-brand">{name}</span>
                  <span className="block truncate text-[12px] text-ink-muted">
                    {investor.email ?? investor.phone}
                    {investor.pan ? <span className="tabular"> · {investor.pan}</span> : null}
                  </span>
                </span>
              </Link>
            </Td>
            <Td>
              <Badge tone={JourneyStageTone[investor.stage]} dot>
                {StageLabel[investor.stage]}
              </Badge>
            </Td>
            <Td>
              <Badge tone={KycStatusTone[investor.kycStatus]}>{KycLabel[investor.kycStatus]}</Badge>
              {investor.kycNextStep ? (
                <span className="mt-1 block text-[11.5px] text-ink-muted">{NextStepLabel[investor.kycNextStep].toLowerCase()}</span>
              ) : null}
            </Td>
            <Td className="tabular">
              {value > 0 ? <span className="font-semibold text-ink">{formatInrString(investor.currentValue)}</span> : '—'}
              {Number(investor.investedAmount) > 0 ? (
                <span className="block text-[11.5px] text-ink-muted">{formatInrString(investor.investedAmount)} bought</span>
              ) : null}
            </Td>
            <Td className="tabular">
              {investor.activeSips > 0 ? (
                <>
                  <span className="font-medium text-ink">{investor.activeSips} active</span>
                  <span className="block text-[11.5px] text-ink-muted">
                    {formatInrString(investor.sipMonthlyAmount, { compact: false })}/mo
                  </span>
                </>
              ) : (
                '—'
              )}
            </Td>
            <Td className="text-[13px]">
              {investor.nextSipDate && due !== null ? (
                <>
                  {formatDate(investor.nextSipDate)}
                  <span className={`block text-[11.5px] ${due <= 3 ? 'font-medium text-warn' : 'text-ink-muted'}`}>
                    {due < 0 ? 'overdue' : due === 0 ? 'today' : due === 1 ? 'tomorrow' : `in ${due} days`}
                  </span>
                </>
              ) : (
                '—'
              )}
            </Td>
            <Td className="text-[13px] text-ink-muted">{timeAgo(investor.lastActivityAt)}</Td>
          </tr>
        );
      })}
    </Table>
  );
}

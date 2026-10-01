import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, Td } from '@/components/ui/table';
import { KindLabel, KindRule, SeverityLabel, SeverityToneOf, StatusLabel, StatusToneOf } from '@/features/compliance/labels';
import type { ComplianceAlertItem } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatDate, formatDateTime } from '@/utils/format';

const Headers = ['Alert', 'Investor', 'Severity', 'Status', 'Assignee', 'Open for'] as const;

export function AlertTable({ alerts }: { alerts: ComplianceAlertItem[] }): React.JSX.Element {
  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={<ShieldCheck className="size-5" />}
        title="Nothing here"
        description="No alerts in this view. The checks run every 10 minutes; anything they find appears here."
      />
    );
  }

  return (
    <Table headers={Headers}>
      {alerts.map((alert) => (
        <tr key={alert.id} className="group transition-colors hover:bg-surface-sunken">
          <Td>
            <Link href={`/compliance/${alert.id}`} className="block min-w-0">
              <span className="flex items-center gap-2">
                <span title={KindRule[alert.kind]}>
                  <Badge tone="neutral">{KindLabel[alert.kind]}</Badge>
                </span>
                <span className="block max-w-[340px] truncate text-[13.5px] font-semibold text-ink group-hover:text-brand">{alert.title}</span>
              </span>
              <span className="mt-1 block max-w-[520px] truncate text-[12px] text-ink-muted" title={alert.detail}>
                {alert.detail}
              </span>
            </Link>
          </Td>
          <Td>
            {alert.investor ? (
              <Link href={`/investors/${alert.investor.id}`} className="block truncate text-[13px] text-ink hover:text-brand">
                {alert.investor.name ?? 'Unnamed investor'}
              </Link>
            ) : (
              <span className="text-ink-muted">—</span>
            )}
            {alert.investor?.pan ? <span className="tabular block text-[12px] text-ink-muted">{alert.investor.pan}</span> : null}
          </Td>
          <Td>
            <Badge tone={SeverityToneOf[alert.severity]} dot>
              {SeverityLabel[alert.severity]}
            </Badge>
          </Td>
          <Td>
            <Badge tone={StatusToneOf[alert.status]}>{StatusLabel[alert.status]}</Badge>
            {alert.autoResolved ? <span className="mt-1 block text-[11.5px] text-ink-muted">cleared by itself</span> : null}
          </Td>
          <Td className="whitespace-nowrap">{alert.assignee?.name ?? <span className="text-ink-muted">Unassigned</span>}</Td>
          <Td className={cn('tabular whitespace-nowrap', alert.ageDays > 7 && !alert.resolvedAt && 'font-semibold text-danger')}>
            <span title={`First detected ${formatDateTime(alert.firstDetectedAt)}`}>
              {alert.ageDays === 0 ? 'today' : `${alert.ageDays}d`}
            </span>
            <span className="block text-[11.5px] font-normal text-ink-muted">since {formatDate(alert.firstDetectedAt)}</span>
          </Td>
        </tr>
      ))}
    </Table>
  );
}

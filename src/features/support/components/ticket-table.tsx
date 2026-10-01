import { LifeBuoy } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, Td } from '@/components/ui/table';
import { CategoryLabel, ChannelLabel, PriorityLabel, PriorityTone, StatusLabel, StatusTone } from '@/features/support/labels';
import type { TicketListItem } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatDateTime, timeAgo } from '@/utils/format';

const Headers = ['Ticket', 'Investor', 'Status', 'Priority', 'Assignee', 'Due', 'Last activity'] as const;

/** "in 3h" / "4h late" against the real clock. */
function dueText(ticket: TicketListItem): string {
  if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') return '—';
  const hours = Math.round((Date.parse(ticket.slaDueAt) - Date.now()) / 3_600_000);
  if (hours < 0) return `${Math.abs(hours)}h late`;
  if (hours < 1) return 'within the hour';
  return hours < 48 ? `in ${hours}h` : `in ${Math.round(hours / 24)}d`;
}

export function TicketTable({ tickets }: { tickets: TicketListItem[] }): React.JSX.Element {
  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={<LifeBuoy className="size-5" />}
        title="No tickets here"
        description="Nothing in this view. Try another view, or clear the search."
      />
    );
  }

  return (
    <Table headers={Headers}>
      {tickets.map((ticket) => (
        <tr key={ticket.id} className="group transition-colors hover:bg-surface-sunken">
          <Td>
            <Link href={`/support/${ticket.id}`} className="block min-w-0">
              <span className="flex items-center gap-2">
                {ticket.awaitingStaff && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' ? (
                  <span className="size-2 shrink-0 rounded-full bg-brand" aria-label="Needs a reply" title="The investor is waiting for a reply" />
                ) : null}
                <span className="block max-w-[320px] truncate text-[13.5px] font-semibold text-ink group-hover:text-brand">{ticket.subject}</span>
              </span>
              <span className="tabular block text-[12px] text-ink-muted">
                {ticket.reference} · {CategoryLabel[ticket.category]} · {ChannelLabel[ticket.channel]}
              </span>
            </Link>
          </Td>
          <Td>
            <span className="block truncate text-[13px] text-ink">{ticket.investor.name ?? 'Unnamed investor'}</span>
            <span className="tabular block text-[12px] text-ink-muted">{ticket.investor.phone ?? ticket.investor.email ?? ''}</span>
          </Td>
          <Td>
            <Badge tone={StatusTone[ticket.status]}>{StatusLabel[ticket.status]}</Badge>
          </Td>
          <Td>
            <Badge tone={PriorityTone[ticket.priority]} dot={ticket.priority === 'URGENT' || ticket.priority === 'HIGH'}>
              {PriorityLabel[ticket.priority]}
            </Badge>
          </Td>
          <Td className="whitespace-nowrap">{ticket.assignee?.name ?? <span className="text-ink-muted">Unassigned</span>}</Td>
          <Td className={cn('whitespace-nowrap tabular', ticket.overdue ? 'font-semibold text-danger' : undefined)}>
            <span title={formatDateTime(ticket.slaDueAt)}>{dueText(ticket)}</span>
          </Td>
          <Td className="whitespace-nowrap text-[12.5px] text-ink-muted">{timeAgo(ticket.lastMessageAt)}</Td>
        </tr>
      ))}
    </Table>
  );
}

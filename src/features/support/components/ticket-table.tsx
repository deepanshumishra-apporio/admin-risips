import { ArrowRight, LifeBuoy, Mail, MessageCircle, Phone, Smartphone } from 'lucide-react';
import Link from 'next/link';

import { EmptyState } from '@/components/ui/empty-state';
import { CategoryLabel, PriorityLabel, PriorityTone, StatusLabel, StatusTone } from '@/features/support/labels';
import type { TicketChannel, TicketListItem } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatDateTime, initialsOf, timeAgo } from '@/utils/format';

import { spanText } from './ticket-overview';

const ChannelIcon: Record<TicketChannel, typeof Mail> = { APP: Smartphone, CHAT: MessageCircle, PHONE: Phone, EMAIL: Mail };
const ChannelVia: Record<TicketChannel, string> = { APP: 'in the app', CHAT: 'via chat', PHONE: 'by phone', EMAIL: 'by email' };

const ToneClass = {
  neutral: 'bg-surface-sunken text-ink-soft',
  brand: 'bg-brand-soft text-brand-deep',
  success: 'bg-success-soft text-success',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  violet: 'bg-violet-soft text-violet',
} as const;

const Pill = ({ tone, children }: { tone: keyof typeof ToneClass; children: React.ReactNode }) => (
  <span className={cn('inline-flex rounded-md px-2.5 py-1 text-[12.5px] font-semibold whitespace-nowrap', ToneClass[tone])}>{children}</span>
);

const done = (ticket: TicketListItem) => ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

/** How much of the resolution window is used, and what to say about it. */
function sla(ticket: TicketListItem, now: number): { headline: string; detail: string; used: number; tone: 'danger' | 'warn' | 'brand' } | null {
  if (done(ticket)) return null;
  const due = Date.parse(ticket.slaDueAt);
  const opened = Date.parse(ticket.createdAt);
  const used = due > opened ? Math.min(1, Math.max(0, (now - opened) / (due - opened))) : 1;
  const hours = Math.round(Math.abs(due - now) / 3_600_000);
  if (now > due) {
    return { headline: `${spanText(now - due)} late`, detail: `${hours} h past the due time`, used: 1, tone: 'danger' };
  }
  return {
    headline: `due in ${spanText(due - now)}`,
    detail: `${Math.round(used * 100)}% of the time used`,
    used,
    tone: used >= 0.75 ? 'warn' : 'brand',
  };
}

const BarClass = { danger: 'bg-danger', warn: 'bg-warn', brand: 'bg-brand' } as const;

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

  const now = Date.now();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px] text-left">
        <thead>
          <tr className="border-y border-line bg-surface-sunken/60 text-[11.5px] font-semibold tracking-[0.06em] text-ink-muted uppercase">
            <th className="py-3 pr-4 pl-6">Ticket</th>
            <th className="px-4 py-3">Investor</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">SLA</th>
            <th className="py-3 pr-6 pl-4">Last activity</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => {
            const Icon = ChannelIcon[ticket.channel];
            const due = sla(ticket, now);
            const href = `/support/${ticket.id}`;
            const waiting = ticket.awaitingStaff && !done(ticket);
            return (
              <tr key={ticket.id} className="group border-b border-line transition-colors last:border-b-0 hover:bg-surface-sunken">
                <td className="py-4 pr-4 pl-6 align-middle">
                  <div className="flex items-start gap-3">
                    <span className="relative mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
                      <Icon className="size-4" />
                      {waiting ? (
                        <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-surface bg-brand" title="The investor is waiting for a reply" />
                      ) : null}
                    </span>
                    <div className="min-w-0">
                      <Link href={href} className="block max-w-[300px] truncate text-[14px] font-semibold text-ink group-hover:text-brand">
                        “{ticket.subject}”
                      </Link>
                      <p className="tabular truncate text-[12.5px] text-ink-muted">
                        {ticket.reference} · {CategoryLabel[ticket.category]} · {ChannelVia[ticket.channel]}
                      </p>
                      {!done(ticket) ? (
                        <Link href={href} className="mt-0.5 inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:text-brand-deep">
                          Reply
                          <ArrowRight className="size-3.5" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 align-middle">
                  <span className="block max-w-[180px] truncate text-[14px] font-semibold text-ink">{ticket.investor.name ?? 'Unnamed investor'}</span>
                  <span className="tabular block text-[12.5px] text-ink-muted">{ticket.investor.phone ?? ticket.investor.email ?? ''}</span>
                </td>
                <td className="px-4 py-4 align-middle">
                  <Pill tone={StatusTone[ticket.status]}>{StatusLabel[ticket.status]}</Pill>
                </td>
                <td className="px-4 py-4 align-middle">
                  <Pill tone={PriorityTone[ticket.priority]}>{PriorityLabel[ticket.priority]}</Pill>
                </td>
                <td className="px-4 py-4 align-middle">
                  {ticket.assignee ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[#1e3a8a] text-[11px] font-semibold text-white">
                        {initialsOf(ticket.assignee.name)}
                      </span>
                      <span className="max-w-[140px] truncate text-[13.5px] text-ink">{ticket.assignee.name}</span>
                    </span>
                  ) : (
                    <span className="text-[13.5px] font-medium text-warn">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-4 align-middle" title={`Due ${formatDateTime(ticket.slaDueAt)}`}>
                  {due ? (
                    <div className="w-[200px]">
                      <span className={cn('block text-[14px] font-semibold', due.tone === 'danger' ? 'text-danger' : 'text-ink')}>{due.headline}</span>
                      <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-line-strong">
                        <span className={cn('block h-full rounded-full', BarClass[due.tone])} style={{ width: `${Math.max(due.used * 100, 4)}%` }} />
                      </span>
                      <span className="tabular mt-1 block text-[12px] text-ink-muted">{due.detail}</span>
                    </div>
                  ) : (
                    <span className="text-[13px] text-ink-muted">Closed out</span>
                  )}
                </td>
                <td className="py-4 pr-6 pl-4 align-middle text-[13.5px] whitespace-nowrap text-ink-soft">{timeAgo(ticket.lastMessageAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

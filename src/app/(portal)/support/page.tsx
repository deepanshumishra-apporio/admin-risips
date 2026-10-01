import { ChevronRight, Plus, Search } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { StatStrip } from '@/components/ui/stat-strip';
import { TicketTable } from '@/features/support/components/ticket-table';
import { CategoryLabel, PriorityLabel, TicketCategories, TicketPriorities } from '@/features/support/labels';
import {
  parseTicketFilters,
  ticketsHref,
  TicketViewCount,
  TicketViewLabel,
  TicketViews,
  toTicketQuery,
} from '@/features/support/ticket-views';
import { listTickets } from '@/lib/api/support';
import { hasPermission } from '@/lib/auth/session';
import { cn } from '@/utils/cn';
import { formatCount } from '@/utils/format';

export const metadata: Metadata = { title: 'Support tickets · RiSips Admin' };

const PageSize = 25;

const ControlClass =
  'h-9 rounded-md border border-line-strong bg-surface px-3 text-[13.5px] text-ink focus:border-brand focus:ring-3 focus:ring-brand/12 focus:outline-none';

type SupportPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SupportPage({ searchParams }: SupportPageProps): Promise<React.JSX.Element> {
  const newTicket = (
    <Link
      href="/support/new"
      className="inline-flex h-9.5 items-center gap-2 rounded-md border border-transparent bg-brand px-4 text-[13.5px] font-medium text-white transition-colors hover:bg-brand-deep"
    >
      <Plus className="size-4" />
      New ticket
    </Link>
  );
  const canManage = await hasPermission('support.manage');
  const header = (
    <PageHeader
      title="Support tickets"
      description="Requests from investors — raised in the app, escalated from chat, or logged by staff from a call or email."
      {...(canManage && { actions: newTicket })}
    />
  );
  if (!canManage) {
    return (
      <>
        {header}
        <NoAccess what="support tickets" />
      </>
    );
  }

  const filters = parseTicketFilters(await searchParams);
  const result = await listTickets(toTicketQuery(filters, PageSize));
  const { summary } = result;

  return (
    <>
      {header}

      <StatStrip
        className="mb-5"
        items={[
          { label: 'Open', value: formatCount(summary.open) },
          { label: 'Needs a reply', value: formatCount(summary.awaitingStaff), caption: 'the investor wrote last' },
          { label: 'Overdue', value: formatCount(summary.overdue), caption: 'past their SLA' },
          { label: 'Unassigned', value: formatCount(summary.unassigned) },
          { label: 'Assigned to you', value: formatCount(summary.mine) },
        ]}
      />

      <nav aria-label="Ticket views" className="mb-3 flex flex-wrap gap-1.5">
        {TicketViews.map((view) => {
          const countKey = TicketViewCount[view];
          return (
            <Link
              key={view}
              href={ticketsHref({ view, q: filters.q })}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors',
                filters.view === view ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line-strong text-ink-soft hover:bg-surface-sunken',
              )}
            >
              {TicketViewLabel[view]}
              {countKey ? <span className="tabular text-[11.5px] opacity-75">{formatCount(summary[countKey])}</span> : null}
            </Link>
          );
        })}
      </nav>

      <form method="get" action="/support" className="mb-4 flex flex-wrap items-end gap-2">
        {filters.view !== 'open' ? <input type="hidden" name="view" value={filters.view} /> : null}
        <label className="min-w-[240px] flex-1">
          <span className="mb-1.5 block text-[12.5px] text-ink-soft">Reference, subject or investor name</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
            <input name="q" defaultValue={filters.q} maxLength={100} placeholder="e.g. RS-100042, mandate, Asha" className={cn(ControlClass, 'w-full pl-9')} />
          </span>
        </label>
        <label>
          <span className="mb-1.5 block text-[12.5px] text-ink-soft">Priority</span>
          <select name="priority" defaultValue={filters.priority ?? ''} className={ControlClass}>
            <option value="">Any priority</option>
            {TicketPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {PriorityLabel[priority]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-[12.5px] text-ink-soft">Category</span>
          <select name="category" defaultValue={filters.category ?? ''} className={ControlClass}>
            <option value="">Any category</option>
            {TicketCategories.map((category) => (
              <option key={category} value={category}>
                {CategoryLabel[category]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="h-9 rounded-md bg-brand px-4 text-[13.5px] font-medium text-white transition-colors hover:bg-brand-deep">
          Apply
        </button>
        <Link href={ticketsHref({ view: filters.view })} className="h-9 rounded-md px-3 text-[13.5px] leading-9 font-medium text-ink-muted hover:text-ink">
          Clear
        </Link>
      </form>

      <Card>
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <p className="text-[12.5px] text-ink-muted">
            <span className="tabular font-semibold text-ink">{formatCount(result.total)}</span> {result.total === 1 ? 'ticket' : 'tickets'} · latest activity first
          </p>
        </div>
        <TicketTable tickets={result.items} />
        {filters.cursor || result.nextCursor ? (
          <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
            {filters.cursor ? (
              <Link href={ticketsHref({ ...filters, cursor: null })} className="text-[13px] font-medium text-brand hover:text-brand-deep">
                Back to first page
              </Link>
            ) : (
              <span />
            )}
            {result.nextCursor ? (
              <Link href={ticketsHref({ ...filters, cursor: result.nextCursor })} className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:text-brand-deep">
                Next {PageSize}
                <ChevronRight className="size-4" />
              </Link>
            ) : null}
          </div>
        ) : null}
      </Card>
    </>
  );
}

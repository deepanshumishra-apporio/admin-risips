import { ArrowRight, CircleCheck, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { TicketOverview } from '@/features/support/components/ticket-overview';
import { TicketTable } from '@/features/support/components/ticket-table';
import { CategoryLabel, PriorityLabel, TicketCategories, TicketPriorities } from '@/features/support/labels';
import {
  parseTicketFilters,
  ticketsHref,
  TicketViewCount,
  TicketViewLabel,
  TicketViews,
  toTicketQuery,
  type TicketView,
} from '@/features/support/ticket-views';
import { listTickets } from '@/lib/api/support';
import { currentStaff, hasPermission } from '@/lib/auth/session';
import type { TicketListItem } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatCount } from '@/utils/format';

export const metadata: Metadata = { title: 'Support tickets · RiSips Admin' };

const PageSize = 25;
/** Overdue tickets read to find the one furthest behind; past this the alert names the worst of these. */
const OverdueScan = 100;

const ControlClass =
  'h-9 w-full rounded-md border border-line-strong bg-surface px-3 text-[13.5px] text-ink focus:border-brand focus:ring-3 focus:ring-brand/12 focus:outline-none';

/** The words under the list when every ticket in the view is on screen. */
const EndOfView: Record<TicketView, string> = {
  open: "That's every open ticket. Closed ones are under Resolved.",
  mine: "That's everything assigned to you.",
  unassigned: "That's every ticket nobody owns yet.",
  overdue: "That's every ticket past its SLA.",
  waiting: "That's every ticket waiting on the investor.",
  done: "That's every resolved and closed ticket.",
  all: "That's every ticket.",
};

type SupportPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SupportPage({ searchParams }: SupportPageProps): Promise<React.JSX.Element> {
  const newTicket = (
    <Link
      href="/support/new"
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-transparent bg-brand px-4 text-[14px] font-semibold text-white transition-colors hover:bg-brand-strong"
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
  const [result, inProgress, overdue, me] = await Promise.all([
    listTickets(toTicketQuery(filters, PageSize)),
    listTickets({ status: ['IN_PROGRESS'], limit: 1 }),
    listTickets({ overdue: true, limit: OverdueScan }),
    currentStaff(),
  ]);
  const { summary } = result;
  // The furthest past its due time: the earliest SLA among the overdue.
  const worst = overdue.items.reduce<TicketListItem | null>(
    (oldest, ticket) => (!oldest || Date.parse(ticket.slaDueAt) < Date.parse(oldest.slaDueAt) ? ticket : oldest),
    null,
  );
  const pickerCount = (filters.priority ? 1 : 0) + (filters.category ? 1 : 0);

  return (
    <>
      {header}

      <TicketOverview summary={summary} inProgress={inProgress.total} viewerName={me.fullName} worst={worst} />

      <Card>
        <div className="space-y-4 px-6 pt-6">
          <nav aria-label="Ticket views" className="flex flex-wrap gap-2">
            {TicketViews.map((view) => {
              const countKey = TicketViewCount[view];
              const active = filters.view === view;
              return (
                <Link
                  key={view}
                  href={ticketsHref({ view, q: filters.q })}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                    active ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line-strong text-ink-soft hover:bg-surface-sunken hover:text-ink',
                  )}
                >
                  {TicketViewLabel[view]}
                  {countKey ? (
                    <span className={cn('tabular font-semibold', active ? 'text-brand-deep' : 'text-ink')}>{formatCount(summary[countKey])}</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <form method="get" action="/support" className="flex flex-wrap items-stretch gap-3">
            {filters.view !== 'open' ? <input type="hidden" name="view" value={filters.view} /> : null}
            <label className="relative min-w-[260px] flex-1">
              <span className="sr-only">Search tickets</span>
              <input
                name="q"
                defaultValue={filters.q}
                maxLength={100}
                placeholder="Reference, subject or investor name"
                className="h-11 w-full rounded-lg border border-line bg-surface-sunken pr-11 pl-4 text-[14px] text-ink placeholder:text-ink-muted focus:border-brand focus:ring-3 focus:ring-brand/12 focus:outline-none"
              />
              <button type="submit" aria-label="Search" className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-ink-muted hover:text-ink">
                <Search className="size-4" />
              </button>
            </label>

            {/* A menu without JavaScript: <details> opens it, Apply submits the form it sits in. */}
            <details className="relative">
              <summary className="flex h-11 cursor-pointer list-none items-center gap-2 rounded-lg border border-line bg-surface-sunken px-4 text-[14px] font-medium text-ink select-none hover:border-line-strong [&::-webkit-details-marker]:hidden">
                <SlidersHorizontal className="size-4 text-ink-muted" />
                Priority · Category
                {pickerCount ? <span className="tabular rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white">{pickerCount}</span> : null}
              </summary>
              <div className="absolute right-0 z-30 mt-2 w-72 space-y-3 rounded-lg border border-line bg-surface p-4 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.35)]">
                <label className="block">
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
                <label className="block">
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
                <div className="flex items-center justify-between pt-1">
                  <Link href={ticketsHref({ view: filters.view, q: filters.q })} className="text-[13px] font-medium text-ink-muted hover:text-ink">
                    Clear filters
                  </Link>
                  <button type="submit" className="h-9 rounded-md bg-brand px-4 text-[13.5px] font-medium text-white transition-colors hover:bg-brand-strong">
                    Apply
                  </button>
                </div>
              </div>
            </details>

            {filters.q ? (
              <Link
                href={ticketsHref({ ...filters, q: '', cursor: null })}
                className="inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-ink-muted hover:text-ink"
              >
                <X className="size-4" />
                Clear search
              </Link>
            ) : null}
          </form>
        </div>

        <p className="px-6 pt-4 pb-3 text-[13px] text-ink-muted">
          <span className="tabular font-semibold text-ink">{formatCount(result.total)}</span> {result.total === 1 ? 'ticket' : 'tickets'} · latest activity first
        </p>

        <TicketTable tickets={result.items} />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4 text-[13px]">
          {result.nextCursor || filters.cursor ? (
            <>
              {filters.cursor ? (
                <Link href={ticketsHref({ ...filters, cursor: null })} className="font-medium text-ink-muted hover:text-ink">
                  Back to the start
                </Link>
              ) : (
                <span className="text-ink-muted">Showing {formatCount(result.items.length)} of {formatCount(result.total)}</span>
              )}
              {result.nextCursor ? (
                <Link
                  href={ticketsHref({ ...filters, cursor: result.nextCursor })}
                  className="inline-flex items-center gap-1.5 font-semibold text-brand hover:text-brand-deep"
                >
                  Next {PageSize}
                  <ArrowRight className="size-4" />
                </Link>
              ) : null}
            </>
          ) : result.items.length > 0 ? (
            <p className="flex items-center gap-2 text-ink-muted">
              <CircleCheck className="size-4 text-success" />
              {filters.q || filters.priority || filters.category ? "That's every ticket that matches." : EndOfView[filters.view]}
            </p>
          ) : (
            <span />
          )}
        </div>
      </Card>
    </>
  );
}

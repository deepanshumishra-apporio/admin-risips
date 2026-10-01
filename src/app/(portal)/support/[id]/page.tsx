import { ArrowLeft, MessagesSquare } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { ReplyComposer } from '@/features/support/components/reply-composer';
import { TicketProperties } from '@/features/support/components/ticket-properties';
import { TicketThread } from '@/features/support/components/ticket-thread';
import { CategoryLabel, ChannelLabel, eventText, PriorityLabel, PriorityTone, StatusLabel, StatusTone } from '@/features/support/labels';
import { ApiError } from '@/lib/api/errors';
import { getTicket, listAgents } from '@/lib/api/support';
import { hasPermission } from '@/lib/auth/session';
import type { TicketDetail } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/format';

export const metadata: Metadata = { title: 'Ticket · RiSips Admin' };

type TicketPageProps = { params: Promise<{ id: string }> };

function Fact({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-[13px]">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  );
}

export default async function TicketPage({ params }: TicketPageProps): Promise<React.JSX.Element> {
  const back = (
    <Link href="/support" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
      <ArrowLeft className="size-3.5" />
      Support tickets
    </Link>
  );
  if (!(await hasPermission('support.manage'))) {
    return (
      <>
        {back}
        <PageHeader title="Ticket" />
        <NoAccess what="support tickets" />
      </>
    );
  }

  const { id } = await params;
  let ticket: TicketDetail;
  try {
    ticket = await getTicket(id);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }
  const agents = await listAgents();
  const investorName = ticket.investor.name ?? 'Investor';
  const closed = ticket.status === 'CLOSED';

  return (
    <>
      {back}
      <PageHeader
        title={ticket.subject}
        description={`${ticket.reference} · ${CategoryLabel[ticket.category]} · raised via ${ChannelLabel[ticket.channel].toLowerCase()} ${formatDateTime(ticket.createdAt)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={StatusTone[ticket.status]}>{StatusLabel[ticket.status]}</Badge>
            <Badge tone={PriorityTone[ticket.priority]} dot>
              {PriorityLabel[ticket.priority]}
            </Badge>
            {ticket.overdue ? <Badge tone="danger">Overdue</Badge> : null}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader title="Conversation" subtitle={`${ticket.messages.filter((m) => !m.internal).length} messages the investor can see`} />
            <CardBody>
              <TicketThread messages={ticket.messages} investorName={investorName} />
            </CardBody>
          </Card>
          <ReplyComposer ticketId={ticket.id} closed={closed} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Investor" />
            <CardBody>
              <dl>
                <Fact label="Name">
                  <Link href={`/investors/${ticket.investor.id}`} className="font-medium text-brand hover:text-brand-deep">
                    {investorName}
                  </Link>
                </Fact>
                {ticket.investor.phone ? <Fact label="Phone"><span className="tabular">{ticket.investor.phone}</span></Fact> : null}
                {ticket.investor.email ? <Fact label="Email">{ticket.investor.email}</Fact> : null}
                {ticket.investor.pan ? <Fact label="PAN"><span className="tabular">{ticket.investor.pan}</span></Fact> : null}
              </dl>
              {ticket.chatConversationId ? (
                <Link
                  href={`/risip-bot?view=closed&chat=${ticket.chatConversationId}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand hover:text-brand-deep"
                >
                  <MessagesSquare className="size-4" /> Open the chat it came from
                </Link>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Details" />
            <CardBody>
              <TicketProperties ticket={ticket} agents={agents} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="SLA" />
            <CardBody>
              <dl>
                <Fact label="Resolve by">
                  <span className={cn('tabular', ticket.overdue && 'font-semibold text-danger')}>{formatDateTime(ticket.slaDueAt)}</span>
                </Fact>
                <Fact label="First response">{ticket.firstResponseAt ? formatDateTime(ticket.firstResponseAt) : '—'}</Fact>
                <Fact label="Resolved">{ticket.resolvedAt ? formatDateTime(ticket.resolvedAt) : '—'}</Fact>
                {ticket.openedBy ? <Fact label="Logged by">{ticket.openedBy.name}</Fact> : null}
                {ticket.related ? <Fact label="About">{`${ticket.related.type} ${ticket.related.id.slice(0, 8)}…`}</Fact> : null}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="History" />
            <ol className="divide-y divide-line">
              {ticket.events.map((event) => (
                <li key={event.id} className="px-4 py-2.5 text-[12.5px]">
                  <p className="text-ink-soft">
                    <span className="font-medium text-ink">
                      {event.actor === 'STAFF' ? event.staffName ?? 'Staff' : event.actor === 'INVESTOR' ? investorName : 'RiSips'}
                    </span>{' '}
                    {eventText(event.type, event.from, event.to)}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-ink-muted">{formatDateTime(event.createdAt)}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}

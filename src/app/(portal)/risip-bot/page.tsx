import { Bot, LifeBuoy, MessagesSquare } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { AutoRefresh } from '@/features/chat/components/auto-refresh';
import { ChatComposer, ChatToolbar, EscalateForm } from '@/features/chat/components/chat-controls';
import { ChatList } from '@/features/chat/components/chat-list';
import { ChatThread } from '@/features/chat/components/chat-thread';
import { chatHref, chatState, ChatViewLabel, ChatViews } from '@/features/chat/labels';
import { ApiError } from '@/lib/api/errors';
import { getChat, listChats } from '@/lib/api/support';
import { currentStaff, hasPermission } from '@/lib/auth/session';
import type { ChatDetail, ChatView } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatCount, formatDateTime } from '@/utils/format';

export const metadata: Metadata = { title: 'Risip Bot · RiSips Admin' };

const Uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RisipBotPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? value[0] ?? '' : value ?? '');

/**
 * The in-app chat, live. Ri answers investors until a person takes over — the
 * investor asked for one, or someone here stepped in by taking over or simply
 * replying. The page re-renders every few seconds while open.
 */
export default async function RisipBotPage({ searchParams }: RisipBotPageProps): Promise<React.JSX.Element> {
  const header = (
    <PageHeader
      title="Risip Bot"
      description="Live conversations with Ri, the in-app assistant. Take over any chat to answer as a person, hand it back when you are done, or turn it into a ticket."
      actions={
        <Badge tone="success" dot>
          Live in app
        </Badge>
      }
    />
  );
  if (!(await hasPermission('support.manage'))) {
    return (
      <>
        {header}
        <NoAccess what="live chat" />
      </>
    );
  }

  const params = await searchParams;
  const viewRaw = first(params['view']) as ChatView;
  const view: ChatView = ChatViews.includes(viewRaw) ? viewRaw : 'live';
  const [me, list] = await Promise.all([currentStaff(), listChats(view)]);
  const requested = first(params['chat']);
  const selectedId = Uuid.test(requested) ? requested : list.items[0]?.id ?? null;

  let chat: ChatDetail | null = null;
  if (selectedId) {
    try {
      chat = await getChat(selectedId);
    } catch (error) {
      if (!(error instanceof ApiError && error.isNotFound)) throw error;
    }
  }
  const counts: Partial<Record<ChatView, number>> = list.summary;
  const state = chat ? chatState(chat) : null;

  return (
    <>
      <AutoRefresh />
      {header}

      <nav aria-label="Chat views" className="mb-4 flex flex-wrap gap-1.5">
        {ChatViews.map((option) => (
          <Link
            key={option}
            href={chatHref(option)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors',
              view === option ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line-strong text-ink-soft hover:bg-surface-sunken',
              option === 'waiting' && (counts.waiting ?? 0) > 0 && view !== option && 'border-warn/40 text-warn',
            )}
          >
            {ChatViewLabel[option]}
            {counts[option] !== undefined ? <span className="tabular text-[11.5px] opacity-75">{formatCount(counts[option] ?? 0)}</span> : null}
          </Link>
        ))}
      </nav>

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_300px]">
        <Card className="scrollbar-thin h-[640px] overflow-y-auto">
          <ChatList chats={list.items} view={view} selectedId={chat?.id ?? null} />
        </Card>

        {chat && state ? (
          <>
            <div className="flex h-[640px] min-w-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
              <header className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy text-white">
                  <Bot className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-ink">{chat.investor.name ?? 'Unnamed investor'}</p>
                  <p className="truncate text-[12px] text-ink-muted">
                    {chat.messageCount} messages · started {formatDateTime(chat.createdAt)}
                  </p>
                </div>
                <Badge tone={state.tone} dot>
                  {state.label}
                </Badge>
              </header>
              <div className="border-b border-line px-4 py-2">
                <ChatToolbar chat={chat} viewerId={me.id} />
              </div>
              {/* Newest at the bottom; flex-col-reverse keeps the view pinned there as messages arrive. */}
              <div className="scrollbar-thin flex flex-1 flex-col-reverse overflow-y-auto">
                <ChatThread messages={chat.messages} investorName={chat.investor.name?.split(' ')[0] ?? 'Investor'} />
              </div>
              <ChatComposer chat={chat} viewerId={me.id} />
            </div>

            <div className="scrollbar-thin max-h-[640px] space-y-4 overflow-y-auto">
              <Card>
                <CardHeader title="Investor" />
                <CardBody className="space-y-1.5 text-[13px]">
                  <Link href={`/investors/${chat.investor.id}`} className="block font-medium text-brand hover:text-brand-deep">
                    {chat.investor.name ?? 'Unnamed investor'}
                  </Link>
                  {chat.investor.phone ? <p className="tabular text-ink-muted">{chat.investor.phone}</p> : null}
                  {chat.investor.email ? <p className="text-ink-muted">{chat.investor.email}</p> : null}
                  {chat.investor.pan ? <p className="tabular text-ink-muted">PAN {chat.investor.pan}</p> : null}
                  {chat.lastIntent ? <p className="pt-1 text-ink-soft">Last topic: {chat.lastIntent}</p> : null}
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Ticket" subtitle={chat.ticket ? undefined : 'For anything that needs follow-up after the chat'} />
                <CardBody>
                  {chat.ticket ? (
                    <Link href={`/support/${chat.ticket.id}`} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand hover:text-brand-deep">
                      <LifeBuoy className="size-4" /> {chat.ticket.reference}
                    </Link>
                  ) : (
                    // A closed chat can still need follow-up: closing first and deciding after is the usual order.
                    <EscalateForm chat={chat} />
                  )}
                </CardBody>
              </Card>
            </div>
          </>
        ) : (
          <Card className="flex h-[640px] flex-col items-center justify-center gap-2 text-center xl:col-span-2">
            <MessagesSquare className="size-6 text-ink-muted" />
            <p className="text-[13.5px] font-medium text-ink">Pick a conversation</p>
            <p className="max-w-sm text-[12.5px] text-ink-muted">Chats waiting for a person are listed oldest first under “Waiting for a person”.</p>
          </Card>
        )}
      </div>
    </>
  );
}

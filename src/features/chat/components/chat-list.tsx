import { MessagesSquare } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { chatHref, chatState } from '@/features/chat/labels';
import type { ChatListItem, ChatView } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { timeAgo } from '@/utils/format';

const SenderPrefix = { INVESTOR: '', BOT: 'Ri: ', STAFF: 'You: ', SYSTEM: '' } as const;

export function ChatList({ chats, view, selectedId }: { chats: ChatListItem[]; view: ChatView; selectedId: string | null }): React.JSX.Element {
  if (chats.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <MessagesSquare className="size-6 text-ink-muted" />
        <p className="text-[13px] font-medium text-ink">No conversations here</p>
        <p className="text-[12.5px] text-ink-muted">New chats appear as investors message Ri in the app.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {chats.map((chat) => {
        const state = chatState(chat);
        const waitingSince = chat.status === 'WAITING_FOR_AGENT' && chat.handoverRequestedAt ? timeAgo(chat.handoverRequestedAt) : null;
        return (
          <li key={chat.id}>
            <Link
              href={chatHref(view, chat.id)}
              className={cn('block px-3.5 py-3 transition-colors hover:bg-surface-sunken', selectedId === chat.id && 'bg-brand-soft/50')}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5">
                  {chat.unreadByStaff ? <span className="size-2 shrink-0 rounded-full bg-brand" aria-label="Unread" /> : null}
                  <span className="truncate text-[13.5px] font-semibold text-ink">{chat.investor.name ?? 'Unnamed investor'}</span>
                </span>
                <span className="shrink-0 text-[11.5px] text-ink-muted">{chat.lastMessage ? timeAgo(chat.lastMessage.at) : ''}</span>
              </div>
              <p className="mt-0.5 truncate text-[12.5px] text-ink-muted">
                {chat.lastMessage ? `${SenderPrefix[chat.lastMessage.sender]}${chat.lastMessage.body}` : 'No messages yet'}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge tone={state.tone} dot={chat.status === 'WAITING_FOR_AGENT'}>
                  {state.label}
                </Badge>
                {waitingSince ? <span className="text-[11.5px] font-medium text-warn">asked {waitingSince}</span> : null}
                {chat.lastIntent ? <span className="truncate text-[11.5px] text-ink-muted">{chat.lastIntent}</span> : null}
                {chat.ticket ? <span className="text-[11.5px] text-ink-muted">· {chat.ticket.reference}</span> : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

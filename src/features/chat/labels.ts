import type { BadgeTone } from '@/components/ui/badge';
import type { ChatListItem, ChatView } from '@/types/admin-api.types';

export const ChatViews: readonly ChatView[] = ['live', 'waiting', 'mine', 'bot', 'closed'];

export const ChatViewLabel: Record<ChatView, string> = {
  live: 'Live',
  waiting: 'Waiting for a person',
  mine: 'Mine',
  bot: 'With Ri',
  closed: 'Closed',
};

/** Who has the conversation right now, in one badge. */
export function chatState(chat: Pick<ChatListItem, 'handler' | 'status' | 'assignee'>): { label: string; tone: BadgeTone } {
  if (chat.status === 'CLOSED') return { label: 'Closed', tone: 'neutral' };
  if (chat.status === 'WAITING_FOR_AGENT') return { label: 'Waiting for a person', tone: 'warn' };
  if (chat.handler === 'HUMAN') return { label: chat.assignee ? `With ${chat.assignee.name.split(' ')[0]}` : 'With staff', tone: 'violet' };
  return { label: 'With Ri', tone: 'brand' };
}

export const chatHref = (view: ChatView, chatId?: string): string => {
  const params = new URLSearchParams();
  if (view !== 'live') params.set('view', view);
  if (chatId) params.set('chat', chatId);
  const text = params.toString();
  return text ? `/risip-bot?${text}` : '/risip-bot';
};

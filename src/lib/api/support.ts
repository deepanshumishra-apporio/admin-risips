import 'server-only';

import { authedRequest } from '@/lib/auth/session';
import type {
  ChatDetail,
  ChatList,
  ChatView,
  StaffRef,
  TicketDetail,
  TicketList,
  TicketListQuery,
} from '@/types/admin-api.types';

export function listTickets(query: TicketListQuery): Promise<TicketList> {
  return authedRequest('/support/tickets', {
    query: {
      status: query.status,
      priority: query.priority,
      category: query.category,
      assignee: query.assignee,
      overdue: query.overdue ? 'true' : undefined,
      search: query.search,
      cursor: query.cursor,
      limit: query.limit,
    },
  });
}

export function getTicket(ticketId: string): Promise<TicketDetail> {
  return authedRequest(`/support/tickets/${encodeURIComponent(ticketId)}`);
}

export function listAgents(): Promise<StaffRef[]> {
  return authedRequest('/support/agents');
}

export function listChats(view: ChatView): Promise<ChatList> {
  return authedRequest('/support/chats', { query: { view } });
}

export function getChat(chatId: string): Promise<ChatDetail> {
  return authedRequest(`/support/chats/${encodeURIComponent(chatId)}`);
}

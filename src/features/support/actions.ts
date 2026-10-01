'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { ApiError } from '@/lib/api/errors';
import { authedRequest } from '@/lib/auth/session';
import type { ChatDetail, TicketDetail } from '@/types/admin-api.types';

export type FormState = { error: string | null; saved?: boolean };

const Uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const text = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
};

/**
 * API errors become a message. Anything else is rethrown — including the
 * redirects `authedRequest` raises for an expired session, which must reach
 * Next rather than be swallowed here.
 */
function failure(error: unknown): FormState {
  if (error instanceof ApiError) return { error: error.message };
  throw error;
}

// --- tickets --------------------------------------------------------------------

export async function replyToTicket(_previous: FormState, form: FormData): Promise<FormState> {
  const ticketId = text(form, 'ticketId');
  const body = text(form, 'body');
  const status = text(form, 'status');
  if (!Uuid.test(ticketId)) return { error: 'That ticket could not be found.' };
  if (!body) return { error: 'Write a reply first.' };
  try {
    await authedRequest(`/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: { body, internal: form.get('internal') === 'on', ...(status && { status }) },
    });
    revalidatePath(`/support/${ticketId}`);
    return { error: null, saved: true };
  } catch (error) {
    return failure(error);
  }
}

export async function updateTicket(_previous: FormState, form: FormData): Promise<FormState> {
  const ticketId = text(form, 'ticketId');
  if (!Uuid.test(ticketId)) return { error: 'That ticket could not be found.' };
  const assignee = text(form, 'assigneeId');
  try {
    await authedRequest(`/support/tickets/${ticketId}`, {
      method: 'PATCH',
      body: {
        status: text(form, 'status'),
        priority: text(form, 'priority'),
        category: text(form, 'category'),
        assigneeId: assignee || null,
      },
    });
    revalidatePath(`/support/${ticketId}`);
    return { error: null, saved: true };
  } catch (error) {
    return failure(error);
  }
}

export async function createTicket(_previous: FormState, form: FormData): Promise<FormState> {
  const userId = text(form, 'userId');
  const subject = text(form, 'subject');
  const body = text(form, 'body');
  if (!Uuid.test(userId)) return { error: 'Choose the investor first.' };
  if (!subject || !body) return { error: 'Give the ticket a subject and describe the request.' };
  let ticket: TicketDetail;
  try {
    ticket = await authedRequest<TicketDetail>('/support/tickets', {
      method: 'POST',
      body: {
        userId, subject, body,
        category: text(form, 'category'),
        priority: text(form, 'priority'),
        channel: text(form, 'channel'),
      },
    });
  } catch (error) {
    return failure(error);
  }
  redirect(`/support/${ticket.id}`);
}

// --- chat -----------------------------------------------------------------------

export type ChatResult = { chat: ChatDetail; error: null } | { chat: null; error: string };

async function chatCall(chatId: string, path: string, body?: unknown): Promise<ChatResult> {
  if (!Uuid.test(chatId)) return { chat: null, error: 'That chat could not be found.' };
  try {
    const chat = await authedRequest<ChatDetail>(`/support/chats/${chatId}/${path}`, {
      method: 'POST',
      ...(body !== undefined && { body }),
    });
    revalidatePath('/risip-bot');
    return { chat, error: null };
  } catch (error) {
    if (error instanceof ApiError) return { chat: null, error: error.message };
    throw error;
  }
}

export async function takeOverChat(chatId: string): Promise<ChatResult> {
  return chatCall(chatId, 'take-over');
}

export async function handBackChat(chatId: string): Promise<ChatResult> {
  return chatCall(chatId, 'hand-back');
}

export async function closeChat(chatId: string): Promise<ChatResult> {
  return chatCall(chatId, 'close');
}

export async function sendChatMessage(chatId: string, body: string): Promise<ChatResult> {
  const trimmed = body.trim();
  if (!trimmed) return { chat: null, error: 'Write a message first.' };
  return chatCall(chatId, 'messages', { body: trimmed });
}

export async function escalateChat(_previous: FormState, form: FormData): Promise<FormState> {
  const chatId = text(form, 'chatId');
  const subject = text(form, 'subject');
  if (!subject) return { error: 'Give the ticket a subject.' };
  const result = await chatCall(chatId, 'escalate', {
    subject,
    category: text(form, 'category'),
    priority: text(form, 'priority'),
  });
  return result.error ? { error: result.error } : { error: null, saved: true };
}

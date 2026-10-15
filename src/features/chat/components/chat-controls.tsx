'use client';

import { Bot, CornerDownLeft, Loader2, Send, UserRoundCheck, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Field, SelectInput, TextInput } from '@/components/ui/field';
import { FormError, SubmitButton } from '@/features/auth/components/form-parts';
import {
  closeChat,
  escalateChat,
  handBackChat,
  sendChatMessage,
  takeOverChat,
  type ChatResult,
  type FormState,
} from '@/features/support/actions';
import { CategoryLabel, PriorityLabel, TicketCategories, TicketPriorities } from '@/features/support/labels';
import type { ChatDetail } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

const MaxLength = 2000;

function useChatAction(): { pending: boolean; error: string | null; run: (call: () => Promise<ChatResult>, after?: () => void) => void } {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return {
    pending,
    error,
    run: (call, after) => {
      setError(null);
      start(async () => {
        const result = await call();
        if (result.error) setError(result.error);
        else {
          after?.();
          router.refresh();
        }
      });
    },
  };
}

/** Take over, hand back, close. Writing a message is itself a takeover, so the composer is always usable. */
export function ChatToolbar({ chat, viewerId }: { chat: ChatDetail; viewerId: string }): React.JSX.Element | null {
  const { pending, error, run } = useChatAction();
  if (chat.status === 'CLOSED') return null;
  const mine = chat.handler === 'HUMAN' && chat.assignee?.id === viewerId;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!mine ? (
        <Button size="sm" variant="primary" disabled={pending} icon={<UserRoundCheck className="size-4" />} onClick={() => run(() => takeOverChat(chat.id))}>
          {chat.handler === 'HUMAN' && chat.assignee ? 'Take over from colleague' : 'Take over'}
        </Button>
      ) : null}
      {chat.handler === 'HUMAN' ? (
        <Button size="sm" disabled={pending} icon={<Bot className="size-4" />} onClick={() => run(() => handBackChat(chat.id))}>
          Hand back to Ri
        </Button>
      ) : null}
      <Button size="sm" variant="ghost" disabled={pending} icon={<XCircle className="size-4" />} onClick={() => run(() => closeChat(chat.id))}>
        Close chat
      </Button>
      {pending ? <Loader2 className="size-4 animate-spin text-ink-muted" /> : null}
      {error ? <span className="text-[12px] text-danger">{error}</span> : null}
    </div>
  );
}

export function ChatComposer({ chat, viewerId }: { chat: ChatDetail; viewerId: string }): React.JSX.Element {
  const [text, setText] = useState('');
  const { pending, error, run } = useChatAction();
  const closed = chat.status === 'CLOSED';
  const takesOver = !(chat.handler === 'HUMAN' && chat.assignee?.id === viewerId);
  const name = chat.investor.name?.split(' ')[0] ?? 'the investor';

  const send = (): void => {
    const body = text.trim();
    if (!body || pending) return;
    run(() => sendChatMessage(chat.id, body), () => setText(''));
  };

  if (closed) {
    return <p className="border-t border-line px-4 py-3 text-[12.5px] text-ink-muted">This chat is closed. The investor starts a new one by sending a message.</p>;
  }

  return (
    <div className="border-t border-line px-4 py-3">
      <div className={cn('rounded-lg border bg-surface focus-within:ring-3 focus-within:ring-brand/12', takesOver ? 'border-warn/40' : 'border-line-strong focus-within:border-brand')}>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, MaxLength))}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          rows={2}
          placeholder={takesOver ? `Write to ${name} — sending takes the chat over from ${chat.handler === 'BOT' ? 'Ri' : 'your colleague'}` : `Reply to ${name}`}
          className="w-full resize-none bg-transparent px-3 py-2.5 text-[13.5px] text-ink placeholder:text-ink-muted focus:outline-none"
        />
        <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2">
          <span className="flex items-center gap-1.5 text-[11.5px] text-ink-muted">
            <CornerDownLeft className="size-3" />
            Enter to send · Shift+Enter for a new line
          </span>
          <div className="flex items-center gap-2.5">
            {error ? <span className="text-[11.5px] text-danger">{error}</span> : null}
            <span className="tabular text-[11.5px] text-ink-muted">
              {text.length}/{MaxLength}
            </span>
            <button
              type="button"
              onClick={send}
              disabled={text.trim().length === 0 || pending}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-[13px] font-medium text-white transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const EscalateInitial: FormState = { error: null };

/** Turn the chat into a tracked ticket; the transcript goes with it as an internal note. */
export function EscalateForm({ chat }: { chat: ChatDetail }): React.JSX.Element {
  const [state, action] = useActionState(escalateChat, EscalateInitial);
  const router = useRouter();
  useEffect(() => {
    if (state.saved) router.refresh();
  }, [state, router]);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="chatId" value={chat.id} />
      <FormError message={state.error} />
      <Field label="Subject" required>
        <TextInput name="subject" required maxLength={160} defaultValue={chat.lastIntent ? `${chat.lastIntent} (from chat)` : ''} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Category">
          <SelectInput name="category" defaultValue="OTHER">
            {TicketCategories.map((category) => (
              <option key={category} value={category}>
                {CategoryLabel[category]}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Priority">
          <SelectInput name="priority" defaultValue="NORMAL">
            {TicketPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {PriorityLabel[priority]}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
      <SubmitButton>Create ticket</SubmitButton>
    </form>
  );
}

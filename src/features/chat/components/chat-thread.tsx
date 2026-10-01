import { Bot } from 'lucide-react';
import { Fragment } from 'react';

import { Avatar } from '@/components/ui/avatar';
import type { ChatMessage } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/format';

/** Server-rendered, so the zone is explicit: staff and investors are in India. */
const clock = (iso: string): string =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });

/** India-local calendar day, for the separators. */
const dayOf = (iso: string): string => new Date(Date.parse(iso) + 5.5 * 3_600_000).toISOString().slice(0, 10);

function dayLabel(iso: string): string {
  const today = dayOf(new Date().toISOString());
  const day = dayOf(iso);
  if (day === today) return 'Today';
  if (day === dayOf(new Date(Date.now() - 86_400_000).toISOString())) return 'Yesterday';
  return formatDate(iso);
}

/**
 * The transcript, oldest first. Investor turns sit right; Ri and staff sit
 * left and are told apart by avatar, because who answered matters on review.
 * Handovers and joins are the system's own lines across the middle.
 */
export function ChatThread({ messages, investorName }: { messages: ChatMessage[]; investorName: string }): React.JSX.Element {
  return (
    <div className="space-y-1 px-4 py-4">
      {messages.map((message, index) => {
        const previous = messages[index - 1];
        const newDay = previous === undefined || dayOf(previous.createdAt) !== dayOf(message.createdAt);
        const fromInvestor = message.sender === 'INVESTOR';
        return (
          <Fragment key={message.id}>
            {newDay ? (
              <div className="flex items-center gap-3 py-3">
                <span className="h-px flex-1 bg-line" />
                <span className="text-[11.5px] text-ink-muted">{dayLabel(message.createdAt)}</span>
                <span className="h-px flex-1 bg-line" />
              </div>
            ) : null}

            {message.sender === 'SYSTEM' ? (
              <p className="py-2 text-center text-[12px] text-ink-muted">
                <span className="rounded-full bg-surface-sunken px-3 py-1">{message.body}</span>
              </p>
            ) : (
              <div className={cn('flex items-end gap-2 py-0.5', fromInvestor ? 'justify-end' : 'justify-start')}>
                {!fromInvestor ? (
                  message.sender === 'BOT' ? (
                    <span className="mb-5 flex size-7 shrink-0 items-center justify-center rounded-full bg-navy text-white">
                      <Bot className="size-3.5" />
                    </span>
                  ) : (
                    <Avatar name={message.staffName ?? 'Staff'} tone="teal" className="mb-5 size-7 text-[10px]" />
                  )
                ) : null}

                <div className="max-w-[76%]">
                  <div
                    className={cn(
                      'rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap',
                      fromInvestor
                        ? 'rounded-br-sm bg-brand text-white'
                        : message.sender === 'BOT'
                          ? 'rounded-bl-sm border border-line bg-surface-sunken text-ink'
                          : 'rounded-bl-sm border border-teal/25 bg-teal/8 text-ink',
                    )}
                  >
                    {message.body}
                  </div>
                  <div className={cn('mt-1 flex items-center gap-2 px-1 text-[11px] text-ink-muted', fromInvestor ? 'justify-end' : 'justify-start')}>
                    <span>{fromInvestor ? investorName : message.sender === 'BOT' ? 'Ri' : message.staffName ?? 'Staff'}</span>
                    <span className="tabular">{clock(message.createdAt)}</span>
                    {message.intent ? <span className="rounded bg-surface-sunken px-1 py-0.5">{message.intent}</span> : null}
                  </div>
                </div>

                {fromInvestor ? <Avatar name={investorName} tone="violet" className="mb-5 size-7 text-[10px]" /> : null}
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

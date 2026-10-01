import { Lock } from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import type { TicketMessage } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/format';

/** The ticket's conversation. Internal notes are marked so nobody mistakes one for what the investor saw. */
export function TicketThread({ messages, investorName }: { messages: TicketMessage[]; investorName: string }): React.JSX.Element {
  return (
    <ol className="space-y-4">
      {messages.map((message) => {
        const fromInvestor = message.author === 'INVESTOR';
        const who = fromInvestor ? investorName : message.author === 'SYSTEM' ? 'RiSips' : message.staffName ?? 'Staff';
        return (
          <li key={message.id} className="flex gap-3">
            <Avatar name={who} tone={fromInvestor ? 'violet' : 'teal'} className="size-8 shrink-0 text-[11px]" />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-[12.5px]">
                <span className="font-semibold text-ink">{who}</span>
                {message.internal ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2 py-0.5 text-[11px] font-medium text-warn">
                    <Lock className="size-3" /> Internal note
                  </span>
                ) : null}
                <span className="text-ink-muted">{formatDateTime(message.createdAt)}</span>
              </p>
              <div
                className={cn(
                  'mt-1.5 rounded-lg border px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap text-ink',
                  message.internal ? 'border-warn/25 bg-warn-soft/40' : fromInvestor ? 'border-line bg-surface' : 'border-teal/20 bg-teal/5',
                )}
              >
                {message.body}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

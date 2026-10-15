'use client';

import { Lock, Send } from 'lucide-react';
import { useActionState, useEffect, useRef, useState } from 'react';

import { FormError } from '@/features/auth/components/form-parts';
import { replyToTicket, type FormState } from '@/features/support/actions';
import { StatusLabel } from '@/features/support/labels';
import type { TicketStatus } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

const Initial: FormState = { error: null };

/** Where a public reply leaves the ticket; an internal note leaves it where it is unless you say otherwise. */
const AfterReply: TicketStatus[] = ['WAITING_ON_INVESTOR', 'IN_PROGRESS', 'RESOLVED'];

export function ReplyComposer({ ticketId, closed }: { ticketId: string; closed: boolean }): React.JSX.Element {
  const [state, action, pending] = useActionState(replyToTicket, Initial);
  const [internal, setInternal] = useState(closed);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.saved) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={action} className={cn('rounded-lg border bg-surface', internal ? 'border-warn/40' : 'border-line-strong')}>
      <input type="hidden" name="ticketId" value={ticketId} />
      <textarea
        name="body"
        required
        maxLength={4000}
        rows={4}
        placeholder={internal ? 'A note for the team. The investor never sees it.' : 'Reply to the investor. They are notified in the app.'}
        className={cn('w-full resize-y rounded-t-lg bg-transparent px-3.5 py-3 text-[13.5px] text-ink placeholder:text-ink-muted focus:outline-none', internal && 'bg-warn-soft/30')}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-3 py-2">
        <label className={cn('inline-flex items-center gap-2 text-[12.5px]', closed ? 'text-ink-muted' : 'text-ink-soft')}>
          <input
            type="checkbox"
            name="internal"
            checked={internal}
            disabled={closed}
            onChange={(event) => setInternal(event.target.checked)}
            className="size-3.5 accent-[var(--color-warn)]"
          />
          <Lock className="size-3.5" /> Internal note
          {closed ? <span className="text-[12px]">(the ticket is closed; reopen it to reply)</span> : null}
        </label>
        <div className="flex items-center gap-2">
          <select name="status" defaultValue="" className="h-8 rounded-md border border-line-strong bg-surface px-2 text-[12.5px] text-ink">
            <option value="">{internal ? 'Keep status' : `Then: ${StatusLabel.WAITING_ON_INVESTOR}`}</option>
            {AfterReply.map((status) => (
              <option key={status} value={status}>
                Then: {StatusLabel[status]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-[13px] font-medium text-white transition-colors hover:bg-brand-strong disabled:opacity-50"
          >
            <Send className="size-3.5" />
            {internal ? 'Add note' : 'Send reply'}
          </button>
        </div>
      </div>
      {state.error ? (
        <div className="border-t border-line px-3 py-2">
          <FormError message={state.error} />
        </div>
      ) : null}
    </form>
  );
}

'use client';

import { ArrowLeft, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useState, useTransition } from 'react';

import { SidePanel } from '@/components/ui/side-panel';
import { FormError } from '@/features/auth/components/form-parts';
import { loadInvestorItem } from '@/features/investors/item-actions';
import { itemHeading, ItemView } from '@/features/investors/components/item-panel/item-views';
import type { InvestorItem, InvestorItemType } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

/** `userId` names the investor when the panel sits on a page that spans many, like transaction monitoring. */
export type ItemRef = { type: InvestorItemType; id: string; userId?: string };

type Entry = { ref: ItemRef; item: InvestorItem | null; error: string | null };

type PanelApi = { open: (ref: ItemRef, options?: { stack?: boolean }) => void };

const PanelContext = createContext<PanelApi | null>(null);

function usePanel(): PanelApi {
  const api = useContext(PanelContext);
  if (!api) throw new Error('Item panel components must sit inside <ItemPanelProvider>');
  return api;
}

/**
 * The investor record's side panel. Items load on click (a server action, so
 * the token never reaches the browser), and opening an item from inside the
 * panel stacks it, so "back" returns to where you were.
 */
export function ItemPanelProvider({ userId, children }: { userId?: string; children: ReactNode }): React.JSX.Element {
  const [stack, setStack] = useState<Entry[]>([]);
  const [pending, startTransition] = useTransition();

  const open = useCallback(
    (ref: ItemRef, options: { stack?: boolean } = {}) => {
      const entry: Entry = { ref, item: null, error: null };
      setStack((current) => (options.stack ? [...current, entry] : [entry]));
      startTransition(async () => {
        const owner = ref.userId ?? userId;
        const result = owner
          ? await loadInvestorItem(owner, ref.type, ref.id)
          : { item: null, error: 'That item could not be found.' };
        setStack((current) =>
          current.map((item) => (item.ref === ref ? { ref, item: result.item, error: result.error } : item)),
        );
      });
    },
    [userId],
  );

  const close = useCallback(() => setStack([]), []);
  const back = useCallback(() => setStack((current) => current.slice(0, -1)), []);

  const top = stack.at(-1);
  const heading = top?.item ? itemHeading(top.item) : { title: 'Loading…', subtitle: undefined };

  return (
    <PanelContext.Provider value={{ open }}>
      {children}
      <SidePanel
        open={Boolean(top)}
        wide
        title={heading.title}
        {...(heading.subtitle && { subtitle: heading.subtitle })}
        onClose={close}
        leading={
          stack.length > 1 ? (
            <button type="button" onClick={back} aria-label="Back" className="mt-0.5 rounded-md p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink">
              <ArrowLeft className="size-4" />
            </button>
          ) : null
        }
      >
        {!top ? null : top.error ? (
          <FormError message={top.error} />
        ) : !top.item || pending ? (
          <p className="flex items-center gap-2 text-[13px] text-ink-muted">
            <Loader2 className="size-4 animate-spin" /> Loading the full record…
          </p>
        ) : (
          // An item opened from inside the panel belongs to the same investor.
          <ItemView item={top.item} onOpen={(ref) => open({ ...ref, ...(top.ref.userId && { userId: top.ref.userId }) }, { stack: true })} />
        )}
      </SidePanel>
    </PanelContext.Provider>
  );
}

/** A table row that opens its item in the panel. Keyboard: focus and press Enter. */
export function ItemRow({ item, label, children }: { item: ItemRef; label: string; children: ReactNode }): React.JSX.Element {
  const { open } = usePanel();
  return (
    <tr
      tabIndex={0}
      role="button"
      aria-label={`Open ${label}`}
      onClick={() => open(item)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open(item);
        }
      }}
      className="cursor-pointer transition-colors hover:bg-surface-sunken focus-visible:bg-brand-soft/40 focus-visible:outline-none"
    >
      {children}
    </tr>
  );
}

/** Any other element (a list item, a link-like line) that opens an item. */
export function ItemButton({ item, label, className, children }: { item: ItemRef; label: string; className?: string; children: ReactNode }): React.JSX.Element {
  const { open } = usePanel();
  return (
    <button type="button" aria-label={`Open ${label}`} onClick={() => open(item)} className={cn('w-full text-left', className)}>
      {children}
    </button>
  );
}

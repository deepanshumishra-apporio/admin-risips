'use client';

import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { cn } from '@/utils/cn';

type SidePanelProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  footer?: ReactNode;
  /** Shown left of the title, e.g. a back button when panels are stacked. */
  leading?: ReactNode;
  /** 640px instead of 460px, for record detail with tables. */
  wide?: boolean;
  children: ReactNode;
};

/** Right-hand drawer used for agent / investor detail and note capture. Escape or the backdrop closes it. */
export function SidePanel({
  open,
  title,
  subtitle,
  onClose,
  footer,
  leading,
  wide = false,
  children,
}: SidePanelProps): React.JSX.Element | null {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="flex-1 bg-navy/35 backdrop-blur-[2px]"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'scrollbar-thin flex w-full flex-col overflow-y-auto border-l border-line bg-surface shadow-2xl',
          wide ? 'max-w-[640px]' : 'max-w-[460px]',
        )}
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-surface px-5 py-4">
          <div className="flex min-w-0 items-start gap-2">
            {leading}
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
              {subtitle ? <p className="mt-0.5 text-[13px] text-ink-muted">{subtitle}</p> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="flex-1 px-5 py-5">{children}</div>
        {footer ? (
          <footer className="sticky bottom-0 border-t border-line bg-surface px-5 py-3.5">{footer}</footer>
        ) : null}
      </aside>
    </div>
  );
}

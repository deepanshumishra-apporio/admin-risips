'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { cn } from '@/utils/cn';

type ModalProps = {
  open: boolean;
  title: string;
  /** Small line above the title, e.g. "Step 1 of 2 · Details". */
  eyebrow?: string;
  onClose: () => void;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** A centred dialog over a dimmed page. Escape or the backdrop closes it. */
export function Modal({ open, title, eyebrow, onClose, footer, className, children }: ModalProps): React.JSX.Element | null {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-navy/35 backdrop-blur-[2px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'scrollbar-thin relative flex max-h-[calc(100dvh-2rem)] w-full max-w-[440px] flex-col overflow-y-auto rounded-xl border border-line bg-surface shadow-2xl',
          className,
        )}
      >
        <header className="px-5 pt-5">
          {eyebrow ? <p className="text-[12px] font-medium text-brand">{eyebrow}</p> : null}
          <h2 className="mt-0.5 text-[17px] font-semibold text-ink">{title}</h2>
        </header>
        <div className="flex-1 px-5 py-4">{children}</div>
        {footer ? <footer className="px-5 pb-5">{footer}</footer> : null}
      </div>
    </div>
  );
}

'use client';

import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

/** The form's submit button; disabled and spinning while the action runs. */
export function SubmitButton({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-10.5 w-full items-center justify-center gap-2 rounded-md bg-brand text-[14px] font-semibold text-white transition-colors hover:bg-brand-deep disabled:cursor-wait disabled:opacity-70"
    >
      {children}
      {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
    </button>
  );
}

export function FormError({ message }: { message: string | null }): React.JSX.Element | null {
  if (!message) return null;

  return (
    <p role="alert" className="flex items-start gap-2 rounded-md border border-danger/25 bg-danger-soft px-3 py-2.5 text-[13px] text-danger">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}

export function Notice({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <p className="rounded-md border border-line bg-surface-sunken px-3 py-2.5 text-[13px] text-ink-soft">{children}</p>
  );
}

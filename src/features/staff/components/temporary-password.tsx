'use client';

import { Check, Copy, KeyRound } from 'lucide-react';
import { useState } from 'react';

/**
 * A password the server issued. It is shown exactly once — only its hash is
 * stored — so the screen says so and makes copying it easy.
 */
export function TemporaryPasswordReveal({ password, email }: { password: string; email?: string }): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-lg border border-warn/30 bg-warn-soft p-4">
      <p className="flex items-center gap-2 text-[13.5px] font-semibold text-ink">
        <KeyRound className="size-4 text-warn" />
        Temporary password{email ? ` for ${email}` : ''}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <code className="tabular flex-1 rounded-md border border-line bg-surface px-3 py-2 text-[15px] tracking-wide text-ink select-all">
          {password}
        </code>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex h-9.5 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 text-[13px] font-medium text-ink hover:bg-surface-sunken"
        >
          {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-soft">
        This is the only time it will be shown. Share it privately; they must choose their own password and set up
        two-factor sign-in the first time they sign in.
      </p>
    </div>
  );
}

'use client';

import { Check, Copy, Download } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

/**
 * The ten one-time recovery codes, shown only this once. Each signs in once in place of the authenticator app, for
 * a lost or broken phone. With `continueTo`, the person must confirm they saved them before going on.
 */
export function RecoveryCodes({ codes, continueTo }: { codes: string[]; continueTo?: string }): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const text = `RiSips Admin recovery codes (each works once)\n\n${codes.join('\n')}\n`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the codes stay on screen to write down */
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'risips-admin-recovery-codes.txt' });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-warn/30 bg-warn-soft px-3.5 py-3 text-[13px] leading-relaxed text-warn">
        Save these recovery codes somewhere safe, like a password manager. If you lose your phone, each one signs you in
        once instead of the authenticator. <strong>They won&apos;t be shown again.</strong>
      </div>

      <ol className="tabular grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-lg border border-line bg-surface-sunken px-4 py-3 text-[15px] tracking-wider text-ink">
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-line-strong bg-surface px-3 text-[13px] font-medium text-ink hover:bg-surface-sunken"
        >
          {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
          {copied ? 'Copied' : 'Copy all'}
        </button>
        <button
          type="button"
          onClick={download}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-line-strong bg-surface px-3 text-[13px] font-medium text-ink hover:bg-surface-sunken"
        >
          <Download className="size-4" />
          Download
        </button>
      </div>

      {continueTo ? (
        <>
          <label className="flex items-center gap-2 text-[13px] text-ink-soft">
            <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="size-4 accent-[var(--color-brand)]" />
            I have saved my recovery codes
          </label>
          {saved ? (
            <Link
              href={continueTo}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-brand px-4 text-[14px] font-semibold text-white hover:bg-brand-strong"
            >
              Continue
            </Link>
          ) : (
            <span className="inline-flex h-10 w-full cursor-not-allowed items-center justify-center rounded-lg bg-brand/50 px-4 text-[14px] font-semibold text-white">
              Continue
            </span>
          )}
        </>
      ) : null}
    </div>
  );
}

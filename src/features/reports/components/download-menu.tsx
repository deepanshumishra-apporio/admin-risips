'use client';

import { Check, ChevronDown, Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/utils/cn';

const Formats = [
  { key: 'xlsx', label: 'Excel', note: '.xlsx, opens in Excel or Google Sheets' },
  { key: 'pdf', label: 'PDF', note: '.pdf, ready to print or share' },
] as const;
type Format = (typeof Formats)[number]['key'];

/**
 * One Download button, Excel unless another format is chosen from the arrow beside it. A plain link: the browser
 * downloads the file itself, through this server.
 */
export function DownloadMenu({ hrefFor }: { hrefFor: Record<Format, string> }): React.JSX.Element {
  const [format, setFormat] = useState<Format>('xlsx');
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const label = Formats.find((f) => f.key === format)!.label;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative inline-flex">
      <a
        href={hrefFor[format]}
        className="inline-flex h-9 items-center gap-2 rounded-l-md bg-brand px-3.5 text-[13.5px] font-medium text-white hover:bg-brand-strong"
      >
        <Download className="size-4" />
        Download {label}
      </a>
      <button
        type="button"
        aria-label="Choose the download format"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center rounded-r-md border-l border-white/25 bg-brand px-2 text-white hover:bg-brand-strong"
      >
        <ChevronDown className="size-4" />
      </button>
      {open ? (
        <div role="menu" className="absolute top-10 right-0 z-40 w-64 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-[0_12px_32px_rgba(11,21,36,0.16)]">
          <p className="px-3 pt-1.5 pb-1 text-[11.5px] font-semibold tracking-[0.04em] text-ink-muted uppercase">Download as</p>
          {Formats.map((f) => (
            <button
              key={f.key}
              type="button"
              role="menuitemradio"
              aria-checked={format === f.key}
              onClick={() => {
                setFormat(f.key);
                setOpen(false);
              }}
              className="flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-surface-sunken"
            >
              <Check className={cn('mt-0.5 size-4 shrink-0 text-brand', format !== f.key && 'invisible')} />
              <span>
                <span className="block text-[13px] font-medium text-ink">{f.label}</span>
                <span className="block text-[11.5px] text-ink-muted">{f.note}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

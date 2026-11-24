'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { countForExport } from '@/features/transactions/export-actions';
import { cn } from '@/utils/cn';

const Formats = [
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
] as const;

const Ranges = [
  { value: 'current', label: 'Current filter' },
  { value: 'today', label: 'Today' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'fy', label: 'This financial year' },
  { value: 'all', label: 'All time' },
] as const;

const ColumnSets = [
  { value: 'all', label: 'All columns' },
  { value: 'summary', label: 'Columns on screen' },
] as const;

const Control =
  'h-9.5 w-full rounded-md border border-line-strong bg-surface px-3 text-[13.5px] text-ink focus:border-brand focus:ring-3 focus:ring-brand/12 focus:outline-none';

/**
 * Export transactions: CSV, Excel or PDF of what the list's filters match. "Current filter" keeps the list's dates;
 * another range replaces them and keeps the other filters. The file downloads straight away.
 */
export function ExportTransactions({ search, total }: { search: string; total: number | null }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<string>('csv');
  const [range, setRange] = useState<string>('current');
  const [columns, setColumns] = useState<string>('all');
  const [count, setCount] = useState<number | null>(total);
  const [counting, setCounting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (range === 'current') {
      setCount(total);
      return;
    }
    let live = true;
    setCounting(true);
    void countForExport(search, range).then((n) => {
      if (!live) return;
      setCount(n);
      setCounting(false);
    });
    return () => {
      live = false;
    };
  }, [open, range, search, total]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const params = new URLSearchParams(search);
  params.delete('cursor');
  params.set('format', format);
  params.set('range', range);
  params.set('columns', columns);
  const href = `/transactions/export?${params.toString()}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9.5 items-center rounded-md border border-line-strong bg-surface px-4 text-[13.5px] font-semibold text-ink hover:bg-surface-sunken"
      >
        Export
      </button>

      {open && typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1524]/45 px-4" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="export-title" className="w-full max-w-[440px] rounded-xl border border-line bg-surface p-6 shadow-2xl">
            <h2 id="export-title" className="text-[18px] font-semibold text-ink">
              Export transactions
            </h2>

            <div className="mt-5 space-y-4">
              <fieldset className="flex flex-wrap gap-5">
                <legend className="sr-only">File type</legend>
                {Formats.map((f) => (
                  <label key={f.value} className="flex cursor-pointer items-center gap-2 text-[13.5px] text-ink">
                    <input type="radio" name="format" value={f.value} checked={format === f.value} onChange={() => setFormat(f.value)} className="size-4 accent-[var(--color-brand)]" />
                    {f.label}
                  </label>
                ))}
              </fieldset>

              <label className="block">
                <span className="mb-1.5 block text-[12.5px] text-ink-soft">Date range</span>
                <select className={Control} value={range} onChange={(e) => setRange(e.target.value)}>
                  {Ranges.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[12.5px] text-ink-soft">Columns</span>
                <select className={Control} value={columns} onChange={(e) => setColumns(e.target.value)}>
                  {ColumnSets.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <p className="min-h-5 text-[12.5px] text-ink-muted">
                {counting ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin" /> Counting…
                  </span>
                ) : count === null ? (
                  'The file holds every transaction your filters match.'
                ) : (
                  `${count.toLocaleString('en-IN')} ${count === 1 ? 'transaction matches' : 'transactions match'} your filters.`
                )}
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="inline-flex h-9.5 items-center rounded-md border border-line-strong px-4 text-[13.5px] font-medium text-ink hover:bg-surface-sunken">
                Cancel
              </button>
              <a
                href={href}
                onClick={() => setTimeout(() => setOpen(false), 300)}
                aria-disabled={count === 0}
                className={cn(
                  'inline-flex h-9.5 items-center rounded-md bg-brand px-4 text-[13.5px] font-medium text-white hover:bg-brand-strong',
                  count === 0 && 'pointer-events-none opacity-50',
                )}
              >
                Export
              </a>
            </div>
          </div>
        </div>
      , document.body) : null}
    </>
  );
}

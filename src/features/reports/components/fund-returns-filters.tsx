'use client';

import { Check, ChevronDown, Search, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';

import { FundReturnFilterKeys, FundReturnFilterLabel } from '@/features/reports/fund-returns';
import type { FundReturnFilterKey, FundReturnsReport } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

type Facet = { name: string; count: number };

/** A dropdown of checkboxes with a search box. Changes apply when it closes, so ticking five AMCs is one reload. */
function MultiSelect({ label, options, selected, onApply }: { label: string; options: Facet[]; selected: string[]; onApply: (values: string[]) => void }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(selected);
  const [q, setQ] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const close = () => {
    setOpen(false);
    setQ('');
    const next = draftRef.current;
    if (next.length !== selected.length || next.some((v) => !selected.includes(v))) onApply(next);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  });

  const shown = options.filter((o) => o.name.toLowerCase().includes(q.trim().toLowerCase()));
  const toggle = (v: string) => setDraft((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]));
  const summary = selected.length === 0 ? 'All' : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : (setDraft(selected), setOpen(true)))}
        className={cn(
          'inline-flex h-9 max-w-[16rem] items-center gap-2 rounded-md border px-3 text-[13px] transition-colors',
          selected.length ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line-strong bg-surface text-ink-soft hover:bg-surface-sunken',
        )}
      >
        <span className="font-medium">{label}:</span>
        <span className="truncate">{summary}</span>
        <ChevronDown className="size-3.5 shrink-0" />
      </button>
      {open ? (
        <div className="absolute top-10 left-0 z-40 w-[min(320px,calc(100vw-32px))] overflow-hidden rounded-lg border border-line bg-surface shadow-[0_12px_32px_rgba(11,21,36,0.16)]">
          {options.length > 8 ? (
            <div className="relative border-b border-line p-2">
              <Search className="pointer-events-none absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-ink-muted" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}`}
                className="h-8 w-full rounded-md border border-line-strong bg-surface pr-2 pl-7 text-[13px] text-ink focus:border-brand focus:outline-none"
              />
            </div>
          ) : null}
          <div className="flex items-center justify-between border-b border-line px-3 py-1.5 text-[12px]">
            <button type="button" onClick={() => setDraft([...new Set([...draft, ...shown.map((o) => o.name)])])} className="font-medium text-brand hover:text-brand-deep">
              Select {q ? 'shown' : 'all'}
            </button>
            <button type="button" onClick={() => setDraft([])} className="font-medium text-ink-muted hover:text-ink">
              Clear
            </button>
          </div>
          <ul role="listbox" aria-multiselectable="true" className="scrollbar-thin max-h-72 overflow-y-auto py-1">
            {shown.map((o) => {
              const on = draft.includes(o.name);
              return (
                <li key={o.name} role="option" aria-selected={on}>
                  <button type="button" onClick={() => toggle(o.name)} className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] hover:bg-surface-sunken">
                    <span className={cn('flex size-4 shrink-0 items-center justify-center rounded border', on ? 'border-brand bg-brand text-white' : 'border-line-strong')}>
                      {on ? <Check className="size-3" /> : null}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-ink">{o.name}</span>
                    <span className="tabular text-[11.5px] text-ink-muted">{o.count.toLocaleString('en-IN')}</span>
                  </button>
                </li>
              );
            })}
            {shown.length === 0 ? <li className="px-3 py-3 text-[12.5px] text-ink-muted">Nothing matches.</li> : null}
          </ul>
          <div className="border-t border-line p-2">
            <button type="button" onClick={close} className="h-8 w-full rounded-md bg-brand text-[13px] font-semibold text-white hover:bg-brand-strong">
              Apply{draft.length ? ` (${draft.length})` : ''}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** The report's filters and grouping, kept in the URL so a view can be shared and downloaded as shown. */
export function FundReturnsFilters({ params, facets }: { params: Record<string, string>; facets: FundReturnsReport['facets'] }): React.JSX.Element {
  const router = useRouter();
  const path = usePathname();
  const [pending, start] = useTransition();
  const go = (change: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(change)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    start(() => router.push(`${path}${next.toString() ? `?${next.toString()}` : ''}`, { scroll: false }));
  };
  const selected = (k: FundReturnFilterKey) => (params[k] ? params[k]!.split('|') : []);
  const any = FundReturnFilterKeys.some((k) => params[k]);

  return (
    <div className={cn('mb-4 flex flex-wrap items-center gap-2 transition-opacity', pending && 'opacity-60')}>
      <div className="inline-flex rounded-lg bg-surface-sunken p-1" role="group" aria-label="Show">
        {(['amc', 'fund'] as const).map((g) => {
          const on = (params['group'] ?? 'amc') === g;
          return (
            <button
              key={g}
              type="button"
              aria-pressed={on}
              onClick={() => go({ group: g === 'fund' ? 'fund' : null })}
              className={cn('rounded-md px-3 py-1 text-[12.5px] font-semibold', on ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink')}
            >
              {g === 'amc' ? 'By AMC' : 'Fund by fund'}
            </button>
          );
        })}
      </div>
      {FundReturnFilterKeys.map((k) => (
        <MultiSelect key={k} label={FundReturnFilterLabel[k]} options={facets[k]} selected={selected(k)} onApply={(values) => go({ [k]: values.length ? values.join('|') : null })} />
      ))}
      {any ? (
        <button
          type="button"
          onClick={() => go(Object.fromEntries(FundReturnFilterKeys.map((k) => [k, null])))}
          className="inline-flex h-9 items-center gap-1 px-2 text-[12.5px] font-semibold text-ink-muted hover:text-ink"
        >
          <X className="size-3.5" />
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

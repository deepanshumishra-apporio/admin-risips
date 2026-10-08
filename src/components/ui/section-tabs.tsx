'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import { cn } from '@/utils/cn';

export type SectionTab = {
  label: string;
  count?: number;
  content: ReactNode;
};

type SectionTabsProps = {
  tabs: SectionTab[];
  /** `pills` is the quieter look for tabs nested inside another tab. */
  variant?: 'underline' | 'pills';
};

/** In-page tabs for a record or a settings screen. Panels are rendered by the
 *  caller and handed in, so switching costs nothing. */
export function SectionTabs({ tabs, variant = 'underline' }: SectionTabsProps): React.JSX.Element {
  const [active, setActive] = useState(0);
  const pills = variant === 'pills';

  return (
    <div>
      {/* The underline is an inset shadow, not a border: a tab's border can then sit on it without
          spilling out of the row, which made Windows draw a vertical scrollbar. */}
      <div
        className={cn(
          'mb-4 flex gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          !pills && 'shadow-[inset_0_-1px_0_var(--color-line)]',
        )}
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActive(index)}
            className={cn(
              'flex items-center gap-1.5 font-medium whitespace-nowrap transition-colors',
              pills
                ? cn(
                    'rounded-full border px-3 py-1 text-[12.5px]',
                    index === active
                      ? 'border-brand bg-brand-soft text-brand-deep'
                      : 'border-line-strong bg-surface text-ink-soft hover:bg-surface-sunken',
                  )
                : cn(
                    'border-b-2 px-3 py-2 text-[13.5px]',
                    index === active
                      ? 'border-brand text-ink'
                      : 'border-transparent text-ink-muted hover:border-line-strong hover:text-ink',
                  ),
            )}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span
                className={cn(
                  'tabular rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                  index === active ? (pills ? 'bg-surface text-brand-deep' : 'bg-brand-soft text-brand-deep') : 'bg-surface-sunken text-ink-muted',
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tabs[active]?.content}
    </div>
  );
}

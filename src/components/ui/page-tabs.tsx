'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/utils/cn';

export type PageTab = {
  label: string;
  href: string;
};

type PageTabsProps = {
  tabs: PageTab[];
};

/** Route-backed tabs for screens that belong to the same section. */
export function PageTabs({ tabs }: PageTabsProps): React.JSX.Element {
  const pathname = usePathname();
  // The most specific tab wins, so /staff/roles lights "Roles" rather than "Staff".
  const matches = tabs.filter((tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`));
  const current = matches.sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <div className="mb-5 flex gap-1 border-b border-line">
      {tabs.map((tab) => {
        const active = tab.href === current;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-[13.5px] font-medium transition-colors',
              active
                ? 'border-brand text-ink'
                : 'border-transparent text-ink-muted hover:border-line-strong hover:text-ink',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

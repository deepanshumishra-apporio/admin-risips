'use client';

import { ChevronDown, LogOut, PanelLeft, PanelLeftOpen, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { entriesFor, isGroup, type NavItem } from '@/components/layout/nav-items';
import { useSidebar } from '@/components/layout/sidebar-state';
import { Tooltip } from '@/components/ui/tooltip';
import { signOut } from '@/features/auth/actions';
import { useUnread } from '@/features/notifications/unread';
import type { Permission } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

const ItemClass = 'flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13.5px] transition-colors';

export function Sidebar({ permissions }: { permissions: Permission[] }): React.JSX.Element {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();
  // A group opens by itself while one of its pages is open; a click opens or closes it for good.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  // The Inbox shows the live unread count the topbar bell reads.
  const unread = useUnread();
  const entries = entriesFor(permissions);

  const isActive = (href: string): boolean => pathname === href || pathname.startsWith(`${href}/`);

  /** One page. `top`: a top-level line with its icon; `child`: indented under its group, text only; `icon`: collapsed. */
  const link = (item: NavItem, kind: 'top' | 'child' | 'icon'): React.JSX.Element => {
    const active = isActive(item.href);
    const badge = item.href === '/notifications' ? (unread > 99 ? '99+' : unread || undefined) : item.badge;
    return (
      <Tooltip label={item.label} disabled={kind !== 'icon'}>
        <Link
          href={item.href}
          aria-current={active ? 'page' : undefined}
          className={cn(
            ItemClass,
            'relative',
            kind === 'icon' && 'justify-center px-0',
            kind === 'child' && 'py-[6px] text-[13px]',
            active
              ? kind === 'child'
                ? 'font-semibold text-brand-deep'
                : 'bg-brand-soft font-medium text-brand-deep'
              : 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
          )}
        >
          {kind === 'child' ? null : <item.icon className={cn('size-4 shrink-0', active ? 'text-brand' : 'text-ink-muted')} strokeWidth={1.9} />}
          {kind === 'icon' ? (
            badge ? <span className="absolute top-1 right-1.5 size-1.5 rounded-full bg-danger" /> : null
          ) : (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              {item.soon ? (
                <span className="rounded-full bg-surface-sunken px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-muted">Soon</span>
              ) : null}
              {badge ? (
                <span className="tabular rounded-full bg-danger-soft px-1.5 py-0.5 text-[11px] font-semibold text-danger">{badge}</span>
              ) : null}
            </>
          )}
        </Link>
      </Tooltip>
    );
  };

  return (
    <aside
      className={cn(
        'sticky top-[var(--shell-header)] hidden h-[calc(100vh-var(--shell-header))] w-[var(--shell-sidebar)]',
        // Follows the theme: white in light mode, navy in dark mode.
        'shrink-0 flex-col overflow-hidden border-r border-line bg-chrome text-ink transition-[width] duration-200 lg:flex',
      )}
    >
      <div className={cn('p-3', collapsed && 'px-2')}>
        <Tooltip label="Quick search" hint="Ctrl K" disabled={!collapsed}>
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-2 rounded-md border border-line-strong bg-surface-sunken text-left text-[13px] text-ink-muted transition-colors hover:bg-surface',
            collapsed ? 'justify-center px-0 py-2' : 'px-2.5 py-2',
          )}
        >
          <Search className="size-4 shrink-0" />
          {collapsed ? null : (
            <>
              <span className="flex-1 truncate">Quick search...</span>
              <kbd className="rounded border border-line-strong bg-surface px-1.5 py-0.5 text-[10.5px] font-medium text-ink-muted">
                Ctrl K
              </kbd>
            </>
          )}
        </button>
        </Tooltip>
      </div>

      <nav className={cn('scrollbar-thin flex-1 overflow-y-auto pb-4', collapsed ? 'px-2' : 'px-3')}>
        <ul className="space-y-0.5">
          {collapsed
            ? // Collapsed: every page as an icon with its name on hover, groups flattened.
              entries
                .flatMap((entry) => (isGroup(entry) ? entry.children : [entry]))
                .map((item) => <li key={item.href}>{link(item, 'icon')}</li>)
            : entries.map((entry) => {
                if (!isGroup(entry)) return <li key={entry.href}>{link(entry, 'top')}</li>;
                const hasActive = entry.children.some((c) => isActive(c.href));
                const open = openGroups[entry.key] ?? hasActive;
                return (
                  <li key={entry.key}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenGroups((g) => ({ ...g, [entry.key]: !open }))}
                      className={cn(
                        ItemClass,
                        'w-full',
                        hasActive ? 'bg-brand-soft font-medium text-brand-deep' : 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
                      )}
                    >
                      <entry.icon className={cn('size-4 shrink-0', hasActive ? 'text-brand' : 'text-ink-muted')} strokeWidth={1.9} />
                      <span className="flex-1 truncate text-left">{entry.label}</span>
                      <ChevronDown className={cn('size-3.5 text-ink-muted transition-transform', !open && '-rotate-90')} />
                    </button>
                    {open ? (
                      <ul className="mt-0.5 ml-[18px] space-y-0.5 border-l border-line pl-2.5">
                        {entry.children.map((item) => (
                          <li key={item.href}>{link(item, 'child')}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
        </ul>
      </nav>

      <div
        className={cn(
          'flex items-center border-t border-line p-2.5',
          collapsed ? 'flex-col gap-1.5' : 'justify-between',
        )}
      >
        <Tooltip label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} hint="Ctrl B">
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" strokeWidth={1.9} />
          ) : (
            <PanelLeft className="size-4" strokeWidth={1.9} />
          )}
        </button>
        </Tooltip>

        <Tooltip label="Sign out" disabled={!collapsed}>
        <form action={signOut}>
          <button
            type="submit"
            aria-label="Sign out"
            className={cn(
              'flex items-center gap-1.5 rounded-md text-[12.5px] font-medium text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink',
              collapsed ? 'p-1.5' : 'px-2 py-1.5',
            )}
          >
            <LogOut className="size-3.5 shrink-0" strokeWidth={1.9} />
            {collapsed ? null : 'Sign out'}
          </button>
        </form>
        </Tooltip>
      </div>
    </aside>
  );
}

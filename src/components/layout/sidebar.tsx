'use client';

import { ChevronDown, LogOut, PanelLeft, PanelLeftOpen, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { sectionsFor } from '@/components/layout/nav-items';
import { useSidebar } from '@/components/layout/sidebar-state';
import { Tooltip } from '@/components/ui/tooltip';
import { signOut } from '@/features/auth/actions';
import type { Permission } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

const ItemClass = 'flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13.5px] transition-colors';

export function Sidebar({ permissions }: { permissions: Permission[] }): React.JSX.Element {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);

  const isActive = (href: string): boolean => pathname === href || pathname.startsWith(`${href}/`);

  const toggleSection = (title: string): void => {
    setCollapsedSections((current) =>
      current.includes(title) ? current.filter((entry) => entry !== title) : [...current, title],
    );
  };

  return (
    <aside
      className={cn(
        'sticky top-[var(--shell-header)] hidden h-[calc(100vh-var(--shell-header))] w-[var(--shell-sidebar)]',
        // Navy in both themes, as in the design: the sidebar takes the dark values.
        'theme-dark shrink-0 flex-col overflow-hidden border-r border-line bg-navy text-ink transition-[width] duration-200 lg:flex',
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
        {sectionsFor(permissions).map((section, index) => {
          const sectionCollapsed = collapsedSections.includes(section.title);

          return (
            <div
              key={section.title}
              className={cn(index === 0 ? 'mt-0' : 'mt-4', collapsed && index > 0 && 'mt-2 border-t border-line pt-2')}
            >
              {collapsed ? null : (
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="flex w-full items-center justify-between px-2.5 py-1 text-[11px] font-semibold tracking-[0.06em] text-ink-muted uppercase"
                >
                  {section.title}
                  <ChevronDown className={cn('size-3.5 transition-transform', sectionCollapsed && '-rotate-90')} />
                </button>
              )}

              {sectionCollapsed && !collapsed ? null : (
                <ul className="mt-0.5 space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item.href);

                    return (
                      <li key={item.href}>
                        <Tooltip label={item.label} disabled={!collapsed}>
                        <Link
                          href={item.href}
                          className={cn(
                            ItemClass,
                            'relative',
                            collapsed && 'justify-center px-0',
                            active
                              ? 'bg-brand-soft font-medium text-brand-deep'
                              : 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
                          )}
                        >
                          <item.icon
                            className={cn('size-4 shrink-0', active ? 'text-brand' : 'text-ink-muted')}
                            strokeWidth={1.9}
                          />

                          {collapsed ? (
                            item.badge ? (
                              <span className="absolute top-1 right-1.5 size-1.5 rounded-full bg-danger" />
                            ) : null
                          ) : (
                            <>
                              <span className="flex-1 truncate">{item.label}</span>
                              {item.soon ? (
                                <span className="rounded-full bg-surface-sunken px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-muted">
                                  Soon
                                </span>
                              ) : null}
                              {item.badge ? (
                                <span className="tabular rounded-full bg-danger-soft px-1.5 py-0.5 text-[11px] font-semibold text-danger">
                                  {item.badge}
                                </span>
                              ) : null}
                            </>
                          )}
                        </Link>
                        </Tooltip>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
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

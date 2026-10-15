'use client';

import Link from 'next/link';

import { AccountMenu, type Account } from '@/components/layout/account-menu';
import { BrandLogo, BrandMark } from '@/components/layout/brand-mark';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { useSidebar } from '@/components/layout/sidebar-state';
import { ThemeToggle } from '@/components/layout/theme-switcher';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { cn } from '@/utils/cn';

/** The top of the shell. Its left cell is the head of the navy sidebar — the
 *  logo — and tracks the sidebar's width, so the two read as one column; the
 *  rest is the breadcrumb, the theme switch, alerts and the signed-in admin. */
export function Topbar({ account }: { account: Account }): React.JSX.Element {
  const { collapsed } = useSidebar();

  return (
    <header className="sticky top-0 z-40 flex h-[var(--shell-header)] items-stretch bg-chrome">
      <div
        className={cn(
          'theme-dark hidden w-[var(--shell-sidebar)] shrink-0 items-center border-r border-line bg-navy transition-[width] duration-200 lg:flex',
          collapsed ? 'justify-center px-2' : 'px-4',
        )}
      >
        <Link href="/" aria-label="RiSips admin home" className="flex items-center">
          {collapsed ? <BrandMark size={28} tone="inverse" /> : <BrandLogo height={26} tone="inverse" />}
        </Link>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-4 border-b border-line px-5">
        <Breadcrumbs />

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <ThemeToggle />
          <NotificationBell />
          <span className="mx-1 h-5 w-px bg-line" />
          <AccountMenu account={account} />
        </div>
      </div>
    </header>
  );
}

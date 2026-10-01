'use client';

import Link from 'next/link';

import { AccountMenu, type Account } from '@/components/layout/account-menu';
import { BrandMark } from '@/components/layout/brand-mark';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { useSidebar } from '@/components/layout/sidebar-state';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { cn } from '@/utils/cn';

/** Full-width chrome: the brand on the rail, breadcrumb in the middle,
 *  alerts and the signed-in admin on the right. The rail tracks the sidebar's
 *  width so the two never disagree. */
export function Topbar({ account }: { account: Account }): React.JSX.Element {
  const { collapsed } = useSidebar();

  return (
    <header className="sticky top-0 z-40 flex h-[var(--shell-header)] items-center border-b border-line bg-surface">
      <div
        className={cn(
          'hidden h-full w-[var(--shell-sidebar)] shrink-0 items-center gap-2.5 border-r border-line transition-[width] duration-200 lg:flex',
          collapsed ? 'justify-center px-2' : 'px-3',
        )}
      >
        <Link href="/" aria-label="RiSips admin home">
          <BrandMark size={28} />
        </Link>

        {collapsed ? null : (
          <Link href="/" className="min-w-0 flex-1 truncate px-1 text-[13.5px] font-semibold text-ink">
            RiSips
          </Link>
        )}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-4 px-5">
        <Breadcrumbs />

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <NotificationBell />
          <span className="h-5 w-px bg-line" />
          <AccountMenu account={account} />
        </div>
      </div>
    </header>
  );
}

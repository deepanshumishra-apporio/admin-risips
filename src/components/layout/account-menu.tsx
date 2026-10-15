'use client';

import { ChevronDown, KeyRound, LogOut, Settings, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { ThemeChooser } from '@/components/layout/theme-switcher';
import { Avatar } from '@/components/ui/avatar';
import { signOut } from '@/features/auth/actions';
import { cn } from '@/utils/cn';

export type Account = { name: string; email: string; role: string };

const MenuItems = [
  { label: 'Profile and settings', icon: Settings, href: '/profile' },
  { label: 'Change password', icon: KeyRound, href: '/signin/password' },
  { label: 'Staff and roles', icon: ShieldCheck, href: '/staff' },
];

/** The signed-in admin. Name and role are visible without opening the menu —
 *  on a portal where sub-admins see less than a super admin, who you are
 *  signed in as is worth stating rather than hiding behind an icon. */
export function AccountMenu({ account }: { account: Account }): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Account menu"
        className={cn(
          'flex items-center gap-2 rounded-md border py-1 pr-2 pl-1 transition-colors',
          open ? 'border-line-strong bg-surface-sunken' : 'border-transparent hover:bg-surface-sunken',
        )}
      >
        <Avatar name={account.name} className="size-7 text-[11px]" />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[12.5px] font-semibold text-ink">{account.name}</span>
          <span className="block text-[11px] text-ink-muted">{account.role}</span>
        </span>
        <ChevronDown className={cn('size-3.5 text-ink-muted transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close account menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />

          <div className="absolute top-11 right-0 z-50 w-60 overflow-hidden rounded-lg border border-line bg-surface shadow-[0_12px_32px_rgba(11,21,36,0.16)]">
            <div className="flex items-center gap-2.5 border-b border-line px-3 py-3">
              <Avatar name={account.name} className="size-9 text-[13px]" />
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-semibold text-ink">{account.name}</p>
                <p className="truncate text-[12px] text-ink-muted">{account.email}</p>
              </div>
            </div>

            <ul className="py-1">
              {MenuItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink"
                  >
                    <item.icon className="size-4 text-ink-muted" strokeWidth={1.9} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="border-t border-line px-3 py-2.5">
              <p className="mb-1.5 text-[11px] font-semibold tracking-[0.06em] text-ink-muted uppercase">Theme</p>
              <ThemeChooser />
            </div>

            <div className="border-t border-line py-1">
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-danger transition-colors hover:bg-danger-soft"
                >
                  <LogOut className="size-4" strokeWidth={1.9} />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

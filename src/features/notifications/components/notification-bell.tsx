'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { AdminNotifications } from '@/data/notifications';
import { cn } from '@/utils/cn';
import { relativeTime } from '@/utils/time';
import { SeverityTone } from '@/utils/tone';

export function NotificationBell(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const unread = AdminNotifications.filter((entry) => !entry.read);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications, ${unread.length} unread`}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'relative rounded-md p-2 transition-colors',
          open ? 'bg-surface-sunken text-ink' : 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
        )}
      >
        <Bell className="size-4.5" strokeWidth={1.9} />
        {unread.length > 0 ? (
          <span className="absolute top-1 right-1 size-2 rounded-full bg-danger ring-2 ring-white" />
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />

          <div className="absolute top-11 right-0 z-50 w-[380px] overflow-hidden rounded-lg border border-line bg-surface shadow-[0_12px_32px_rgba(11,21,36,0.16)]">
            <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <p className="text-[13.5px] font-semibold text-ink">
                Notifications
                {unread.length > 0 ? (
                  <span className="tabular ml-2 rounded-full bg-danger-soft px-1.5 py-0.5 text-[11px] font-semibold text-danger">
                    {unread.length} new
                  </span>
                ) : null}
              </p>
              <button type="button" className="text-[12.5px] font-medium text-brand hover:text-brand-deep">
                Mark all read
              </button>
            </header>

            <ul className="scrollbar-thin max-h-[360px] divide-y divide-line overflow-y-auto">
              {AdminNotifications.slice(0, 6).map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={entry.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'block px-4 py-3 transition-colors hover:bg-surface-sunken',
                      entry.read ? 'opacity-70' : undefined,
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {entry.read ? (
                        <span className="mt-1.5 size-1.5 shrink-0" />
                      ) : (
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-ink">{entry.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-[12px] text-ink-muted">{entry.detail}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Badge tone={SeverityTone[entry.severity]}>{entry.kind}</Badge>
                          <span className="text-[11.5px] text-ink-muted">{relativeTime(entry.createdAt)} ago</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-line px-4 py-2.5 text-center text-[13px] font-medium text-brand hover:bg-surface-sunken"
            >
              Open inbox
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}

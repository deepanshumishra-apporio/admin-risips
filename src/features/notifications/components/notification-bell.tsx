'use client';

import { Bell, BellOff } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { loadNotifications, markAllNotificationsRead, markNotificationRead } from '@/features/notifications/actions';
import { ago, setUnread } from '@/features/notifications/unread';
import type { NotificationFeed } from '@/types/notification.types';
import { cn } from '@/utils/cn';
import { SeverityTone } from '@/utils/tone';

const PollMs = 60_000;

/** The topbar bell: the latest notifications, read again every minute and whenever it opens. */
export function NotificationBell(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [feed, setFeed] = useState<NotificationFeed | null>(null);

  const refresh = useCallback(async () => {
    const next = await loadNotifications();
    if (!next) return;
    setFeed(next);
    setUnread(next.unread);
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, PollMs);
    return () => clearInterval(timer);
  }, [refresh]);

  const unread = feed?.unread ?? 0;
  const items = feed?.items.slice(0, 8) ?? [];

  const readOne = (id: string) => {
    if (!feed) return;
    const target = feed.items.find((n) => n.id === id);
    if (!target || target.read) return;
    const next = { items: feed.items.map((n) => (n.id === id ? { ...n, read: true } : n)), unread: Math.max(0, feed.unread - 1) };
    setFeed(next);
    setUnread(next.unread);
    void markNotificationRead(id);
  };

  const readAll = () => {
    if (!feed) return;
    setFeed({ items: feed.items.map((n) => ({ ...n, read: true })), unread: 0 });
    setUnread(0);
    void markAllNotificationsRead();
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications, ${unread} unread`}
        onClick={() => {
          setOpen((value) => !value);
          if (!open) void refresh();
        }}
        className={cn(
          'relative rounded-md p-2 transition-colors',
          open ? 'bg-surface-sunken text-ink' : 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
        )}
      >
        <Bell className="size-4.5" strokeWidth={1.9} />
        {unread > 0 ? (
          <span className="tabular absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-surface">
            {unread > 99 ? '99+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button type="button" aria-label="Close notifications" onClick={() => setOpen(false)} className="fixed inset-0 z-40 cursor-default" />

          <div className="absolute top-11 right-0 z-50 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-lg border border-line bg-surface shadow-[0_12px_32px_rgba(11,21,36,0.16)]">
            <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <p className="text-[13.5px] font-semibold text-ink">
                Notifications
                {unread > 0 ? (
                  <span className="tabular ml-2 rounded-full bg-danger-soft px-1.5 py-0.5 text-[11px] font-semibold text-danger">{unread} new</span>
                ) : null}
              </p>
              {unread > 0 ? (
                <button type="button" onClick={readAll} className="text-[12.5px] font-medium text-brand hover:text-brand-deep">
                  Mark all read
                </button>
              ) : null}
            </header>

            {!feed ? (
              <p className="px-4 py-8 text-center text-[13px] text-ink-muted">Loading…</p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-[13px] text-ink-muted">
                <BellOff className="size-5" />
                Nothing yet. HUF, compliance and ticket updates show here.
              </div>
            ) : (
              <ul className="scrollbar-thin max-h-[380px] divide-y divide-line overflow-y-auto">
                {items.map((entry) => (
                  <li key={entry.id}>
                    <Link
                      href={entry.href}
                      onClick={() => {
                        readOne(entry.id);
                        setOpen(false);
                      }}
                      className={cn('block px-4 py-3 transition-colors hover:bg-surface-sunken', entry.read && 'opacity-70')}
                    >
                      <div className="flex items-start gap-2">
                        <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', !entry.read && 'bg-brand')} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-ink">{entry.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-[12px] text-ink-muted">{entry.detail}</p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <Badge tone={SeverityTone[entry.severity]}>{entry.kind}</Badge>
                            {entry.forYou ? <Badge tone="brand">For you</Badge> : null}
                            <span className="text-[11.5px] text-ink-muted">{ago(entry.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

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

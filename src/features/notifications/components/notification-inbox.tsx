'use client';

import { BellOff, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterBar } from '@/components/ui/filter-bar';
import { RowMenu } from '@/components/ui/row-menu';
import { StatStrip } from '@/components/ui/stat-strip';
import { Tabs } from '@/components/ui/tabs';
import { markAllNotificationsRead, markNotificationRead } from '@/features/notifications/actions';
import { ago, setUnread } from '@/features/notifications/unread';
import type { AdminNotification, NotificationFeed } from '@/types/notification.types';
import { cn } from '@/utils/cn';
import { formatCount } from '@/utils/format';
import { SeverityTone } from '@/utils/tone';

const FilterTabs = ['All', 'Unread', 'High', 'For me'] as const;
type FilterTab = (typeof FilterTabs)[number];

const KindFilters = ['All kinds', 'HUF', 'Compliance', 'Support', 'Investor', 'Mandate'] as const;
type KindFilter = (typeof KindFilters)[number];

function timestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
}

/** The signed-in person's notifications: filter, read and unread, one click to the record each is about. */
export function NotificationInbox({ feed }: { feed: NotificationFeed }): React.JSX.Element {
  const router = useRouter();
  const [items, setItems] = useState<AdminNotification[]>(feed.items);
  const [filter, setFilter] = useState<FilterTab>('All');
  const [kind, setKind] = useState<KindFilter>('All kinds');
  const [query, setQuery] = useState('');

  const unread = items.filter((entry) => !entry.read).length;
  const high = items.filter((entry) => entry.severity === 'High' && !entry.read).length;
  const forMe = items.filter((entry) => entry.forYou && !entry.read).length;
  const today = items.filter((entry) => Date.now() - Date.parse(entry.createdAt) < 86_400_000).length;

  // The bell and the sidebar badge follow what's read here.
  useEffect(() => setUnread(unread), [unread]);

  const setRead = (id: string, read: boolean): void => {
    setItems((current) => current.map((entry) => (entry.id === id ? { ...entry, read } : entry)));
    void markNotificationRead(id, read);
  };

  const markAllRead = (): void => {
    setItems((current) => current.map((entry) => ({ ...entry, read: true })));
    void markAllNotificationsRead();
  };

  const visible = items.filter((entry) => {
    const matchesFilter =
      filter === 'All' || (filter === 'Unread' && !entry.read) || (filter === 'High' && entry.severity === 'High') || (filter === 'For me' && entry.forYou);
    const matchesKind = kind === 'All kinds' || entry.kind === kind;
    return matchesFilter && matchesKind && `${entry.title} ${entry.detail}`.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <>
      <StatStrip
        className="mb-5"
        items={[
          { label: 'Unread', value: formatCount(unread), caption: `of ${items.length} in the feed` },
          { label: 'High, unread', value: formatCount(high), caption: 'needs action now' },
          { label: 'For you', value: formatCount(forMe), caption: 'assigned to you, unread' },
          { label: 'Last 24 hours', value: formatCount(today), caption: 'new notifications' },
        ]}
      />

      <FilterBar label="Search notifications" value={query} onChange={setQuery} placeholder="HUF, investor, ticket or event">
        <Tabs tabs={FilterTabs} active={filter} onChange={setFilter} size="sm" />
        <Tabs tabs={KindFilters} active={kind} onChange={setKind} size="sm" />
        {unread > 0 ? (
          <Button size="sm" icon={<CheckCheck className="size-3.5" />} onClick={markAllRead}>
            Mark all read
          </Button>
        ) : null}
      </FilterBar>

      <Card>
        {visible.length === 0 ? (
          <EmptyState
            icon={<BellOff className="size-5" />}
            title={items.length ? 'Nothing here' : 'No notifications yet'}
            description={items.length ? 'No notifications match this filter.' : 'HUF updates from NSE, new compliance alerts, tickets assigned to you and the daily sign-up digest show here.'}
          />
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface-sunken">
                <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', entry.read ? 'bg-line-strong' : 'bg-brand')} />

                <div className="min-w-0 flex-1">
                  <Link
                    href={entry.href}
                    onClick={() => !entry.read && setRead(entry.id, true)}
                    className={cn('text-[13.5px] hover:text-brand', entry.read ? 'font-medium text-ink-soft' : 'font-semibold text-ink')}
                  >
                    {entry.title}
                  </Link>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-muted">{entry.detail}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge tone={SeverityTone[entry.severity]} dot>
                      {entry.severity}
                    </Badge>
                    <Badge tone="neutral">{entry.kind}</Badge>
                    {entry.forYou ? <Badge tone="brand">For you</Badge> : null}
                    <span className="tabular text-[11.5px] text-ink-muted" title={timestamp(entry.createdAt)}>
                      {ago(entry.createdAt)}
                    </span>
                  </div>
                </div>

                <RowMenu
                  label={entry.title}
                  items={[
                    { label: entry.read ? 'Mark unread' : 'Mark read', onSelect: () => setRead(entry.id, !entry.read) },
                    { label: 'Open record', onSelect: () => router.push(entry.href) },
                  ]}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

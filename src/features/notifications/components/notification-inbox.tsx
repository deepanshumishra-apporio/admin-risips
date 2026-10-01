'use client';

import { BellOff, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterBar } from '@/components/ui/filter-bar';
import { RowMenu } from '@/components/ui/row-menu';
import { StatStrip } from '@/components/ui/stat-strip';
import { Tabs } from '@/components/ui/tabs';
import { AdminNotifications } from '@/data/notifications';
import type { AdminNotification } from '@/types/notification.types';
import { cn } from '@/utils/cn';
import { formatCount } from '@/utils/format';
import { SeverityTone } from '@/utils/tone';

const FilterTabs = ['All', 'Unread', 'High', 'Assigned to me'] as const;
type FilterTab = (typeof FilterTabs)[number];

const CurrentAdmin = 'Simmi Puri';

function timestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NotificationInbox(): React.JSX.Element {
  const [items, setItems] = useState<AdminNotification[]>(AdminNotifications);
  const [filter, setFilter] = useState<FilterTab>('All');
  const [query, setQuery] = useState('');

  const unread = items.filter((entry) => !entry.read).length;
  const high = items.filter((entry) => entry.severity === 'High').length;
  const unassigned = items.filter((entry) => entry.assignee === null).length;

  const markRead = (id: string): void => {
    setItems((current) => current.map((entry) => (entry.id === id ? { ...entry, read: true } : entry)));
  };

  const markAllRead = (): void => {
    setItems((current) => current.map((entry) => ({ ...entry, read: true })));
  };

  const visible = items.filter((entry) => {
    const matchesFilter =
      filter === 'All' ||
      (filter === 'Unread' && !entry.read) ||
      (filter === 'High' && entry.severity === 'High') ||
      (filter === 'Assigned to me' && entry.assignee === CurrentAdmin);

    return matchesFilter && `${entry.title} ${entry.detail}`.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <>
      <StatStrip
        className="mb-5"
        items={[
          { label: 'Unread', value: formatCount(unread), caption: `of ${items.length} in the feed` },
          { label: 'High severity', value: formatCount(high), caption: 'needs action today' },
          { label: 'Unassigned', value: formatCount(unassigned), caption: 'no owner yet' },
          { label: 'Median time to action', value: '3.1 h', caption: 'last 30 days' },
        ]}
      />

      <FilterBar label="Search notifications" value={query} onChange={setQuery} placeholder="Investor, agent or event">
        <Tabs tabs={FilterTabs} active={filter} onChange={setFilter} size="sm" />
        <Button size="sm" icon={<CheckCheck className="size-3.5" />} onClick={markAllRead}>
          Mark all read
        </Button>
      </FilterBar>

      <Card>
        {visible.length === 0 ? (
          <EmptyState
            icon={<BellOff className="size-5" />}
            title="Nothing here"
            description="No notifications match this filter."
          />
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((entry) => (
              <li
                key={entry.id}
                className={cn('flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface-sunken')}
              >
                <span
                  className={cn(
                    'mt-1.5 size-2 shrink-0 rounded-full',
                    entry.read ? 'bg-line-strong' : 'bg-brand',
                  )}
                />

                <div className="min-w-0 flex-1">
                  <Link
                    href={entry.href}
                    onClick={() => markRead(entry.id)}
                    className="text-[13.5px] font-semibold text-ink hover:text-brand"
                  >
                    {entry.title}
                  </Link>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-muted">{entry.detail}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge tone={SeverityTone[entry.severity]} dot>
                      {entry.severity}
                    </Badge>
                    <Badge tone="neutral">{entry.kind}</Badge>
                    <span className="tabular text-[11.5px] text-ink-muted">{timestamp(entry.createdAt)}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {entry.assignee === null ? (
                    <span className="text-[12px] text-ink-muted">Unassigned</span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Avatar name={entry.assignee} tone="teal" className="size-6 text-[10px]" />
                      <span className="hidden text-[12.5px] text-ink-soft sm:block">{entry.assignee}</span>
                    </span>
                  )}

                  <RowMenu
                    label={entry.title}
                    items={[
                      { label: entry.read ? 'Mark unread' : 'Mark read', onSelect: () => markRead(entry.id) },
                      { label: 'Assign to sub-admin' },
                      { label: 'Open record' },
                      { label: 'Mute this type', tone: 'danger' },
                    ]}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

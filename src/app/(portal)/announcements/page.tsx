import { Megaphone, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { NoAccess } from '@/components/ui/no-access';
import { PageTabs } from '@/components/ui/page-tabs';
import { StatStrip } from '@/components/ui/stat-strip';
import { Table, Td } from '@/components/ui/table';
import { AudienceLabel, CategoryLabel, StatusLabel, StatusTone } from '@/features/announcements/labels';
import { EngagementTabs } from '@/features/notifications/engagement-tabs';
import { listAnnouncements } from '@/lib/api/announcements';
import { hasPermission } from '@/lib/auth/session';
import type { AnnouncementStatus } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatCount, formatDateTime } from '@/utils/format';

export const metadata: Metadata = { title: 'Announcements · RiSips Admin' };

const Views: { key: string; label: string; status?: AnnouncementStatus[] }[] = [
  { key: 'all', label: 'All' },
  { key: 'approval', label: 'Awaiting approval', status: ['PENDING_APPROVAL'] },
  { key: 'drafts', label: 'Drafts', status: ['DRAFT', 'REJECTED'] },
  { key: 'scheduled', label: 'Scheduled', status: ['SCHEDULED'] },
  { key: 'live', label: 'Live', status: ['LIVE'] },
  { key: 'done', label: 'Completed', status: ['COMPLETED', 'CANCELLED'] },
];

const Headers = ['Announcement', 'Audience', 'Goes out as', 'Status', 'Starts', 'Delivered', 'By'] as const;

type AnnouncementsPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AnnouncementsPage({ searchParams }: AnnouncementsPageProps): Promise<React.JSX.Element> {
  const canManage = await hasPermission('announcements.manage');
  const header = (
    <PageHeader
      title="Announcements"
      description="Offers, product updates and notices to investors — as an in-app notification, a home banner, or both. Every announcement is approved by a second admin."
      {...(canManage && {
        actions: (
          <Link href="/announcements/new" className="inline-flex h-9.5 items-center gap-2 rounded-md bg-brand px-4 text-[13.5px] font-medium text-white hover:bg-brand-deep">
            <Plus className="size-4" />
            New announcement
          </Link>
        ),
      })}
    />
  );
  if (!canManage) {
    return (
      <>
        <PageTabs tabs={EngagementTabs} />
        {header}
        <NoAccess what="announcements" />
      </>
    );
  }

  const params = await searchParams;
  const viewKey = typeof params['view'] === 'string' ? params['view'] : 'all';
  const view = Views.find((entry) => entry.key === viewKey) ?? Views[0]!;
  const { items, summary } = await listAnnouncements(view.status);

  return (
    <>
      <PageTabs tabs={EngagementTabs} />
      {header}

      <StatStrip
        className="mb-5"
        items={[
          { label: 'Awaiting approval', value: formatCount(summary.awaitingApproval), caption: 'needs a second admin' },
          { label: 'Scheduled', value: formatCount(summary.scheduled) },
          { label: 'Live banners', value: formatCount(summary.live) },
          { label: 'Drafts', value: formatCount(summary.drafts) },
        ]}
      />

      <nav aria-label="Announcement views" className="mb-4 flex flex-wrap gap-1.5">
        {Views.map((entry) => (
          <Link
            key={entry.key}
            href={entry.key === 'all' ? '/announcements' : `/announcements?view=${entry.key}`}
            className={cn(
              'rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors',
              view.key === entry.key ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line-strong text-ink-soft hover:bg-surface-sunken',
            )}
          >
            {entry.label}
          </Link>
        ))}
      </nav>

      <Card>
        {items.length === 0 ? (
          <EmptyState icon={<Megaphone className="size-5" />} title="No announcements here" description="Compose one with New announcement; it goes to a colleague for approval." />
        ) : (
          <Table headers={Headers}>
            {items.map((item) => (
              <tr key={item.id} className="group transition-colors hover:bg-surface-sunken">
                <Td>
                  <Link href={`/announcements/${item.id}`} className="block min-w-0">
                    <span className="block max-w-[320px] truncate text-[13.5px] font-semibold text-ink group-hover:text-brand">{item.name}</span>
                    <span className="block max-w-[320px] truncate text-[12px] text-ink-muted">{item.title}</span>
                  </Link>
                </Td>
                <Td>
                  <span className="block text-[13px]">{AudienceLabel[item.audience]}</span>
                  <span className="block text-[12px] text-ink-muted">{CategoryLabel[item.category]}</span>
                </Td>
                <Td className="text-[12.5px]">{[item.sendNotification && 'Notification', item.showBanner && 'Banner'].filter(Boolean).join(' + ')}</Td>
                <Td>
                  <Badge tone={StatusTone[item.status]} dot={item.status === 'LIVE'}>
                    {StatusLabel[item.status]}
                  </Badge>
                </Td>
                <Td className="whitespace-nowrap text-[12.5px]">{formatDateTime(item.startsAt)}</Td>
                <Td className="tabular">{item.sentAt ? formatCount(item.deliveredCount) : '—'}</Td>
                <Td className="text-[12.5px]">
                  <span className="block">{item.createdBy?.name ?? '—'}</span>
                  {item.approvedBy ? <span className="block text-ink-muted">approved by {item.approvedBy.name}</span> : null}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}

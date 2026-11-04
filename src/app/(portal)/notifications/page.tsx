import type { Metadata } from 'next';

import { PageHeader } from '@/components/layout/page-header';
import { PageTabs } from '@/components/ui/page-tabs';
import { NotificationInbox } from '@/features/notifications/components/notification-inbox';
import { EngagementTabs } from '@/features/notifications/engagement-tabs';
import { getNotifications } from '@/lib/api/notifications';

export const metadata: Metadata = { title: 'Inbox · RiSips Admin' };

export default async function NotificationsPage(): Promise<React.JSX.Element> {
  const feed = await getNotifications();
  return (
    <>
      <PageTabs tabs={EngagementTabs} />

      <PageHeader
        title="Inbox"
        description="What needs a person: HUF updates from NSE, new compliance alerts, tickets assigned to you, and a daily digest of sign-ups. Each opens the record it's about."
      />

      <NotificationInbox feed={feed} />
    </>
  );
}

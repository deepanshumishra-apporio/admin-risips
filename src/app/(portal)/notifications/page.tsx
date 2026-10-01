import { PageHeader } from '@/components/layout/page-header';
import { PageTabs } from '@/components/ui/page-tabs';
import { NotificationInbox } from '@/features/notifications/components/notification-inbox';
import { EngagementTabs } from '@/features/notifications/engagement-tabs';

export default function NotificationsPage(): React.JSX.Element {
  return (
    <>
      <PageTabs tabs={EngagementTabs} />

      <PageHeader
        title="Inbox"
        description="Business events that need a human — stuck KYC, bounced mandates, expiring licences and drafts awaiting publish."
      />

      <NotificationInbox />
    </>
  );
}

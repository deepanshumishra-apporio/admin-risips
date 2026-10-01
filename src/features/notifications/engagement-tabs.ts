import type { PageTab } from '@/components/ui/page-tabs';

/** The inbox is what the admin receives; announcements are what they send. */
export const EngagementTabs: PageTab[] = [
  { label: 'Inbox', href: '/notifications' },
  { label: 'Announcements', href: '/announcements' },
];

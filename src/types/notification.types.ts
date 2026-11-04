import type { AlertSeverity } from '@/types/compliance.types';

export type AdminNotificationKind = 'HUF' | 'Compliance' | 'Support' | 'Investor' | 'Mandate' | 'Portfolio';

/** Something that happened in the business and needs a human to look at it. */
export type AdminNotification = {
  id: string;
  kind: AdminNotificationKind;
  severity: AlertSeverity;
  title: string;
  detail: string;
  /** The record this is about, so the row is one click from the fix. */
  href: string;
  createdAt: string;
  read: boolean;
  /** Sent to this person alone (a ticket assigned to them), not to everyone with the permission. */
  forYou: boolean;
  assignee: string | null;
};

export type NotificationFeed = { items: AdminNotification[]; unread: number };

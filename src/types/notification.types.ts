import type { AlertSeverity } from '@/types/compliance.types';

export type AdminNotificationKind =
  | 'Compliance'
  | 'Mandate'
  | 'Portfolio'
  | 'Agent'
  | 'Investor'
  | 'Meeting';

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
  assignee: string | null;
};

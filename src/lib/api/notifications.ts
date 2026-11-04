import 'server-only';

import { authedRequest } from '@/lib/auth/session';
import type { AdminNotification, NotificationFeed } from '@/types/notification.types';

type ApiFeed = { items: (Omit<AdminNotification, 'severity'> & { severity: 'HIGH' | 'MEDIUM' | 'LOW' })[]; unread: number };

const Severity = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' } as const;

/** The signed-in person's notifications, newest first, with how many they haven't read. */
export async function getNotifications(): Promise<NotificationFeed> {
  const feed = await authedRequest<ApiFeed>('/notifications');
  return { items: feed.items.map((n) => ({ ...n, severity: Severity[n.severity] ?? 'Low' })), unread: feed.unread };
}

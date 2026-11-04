'use server';

import { ApiError } from '@/lib/api/errors';
import { getNotifications } from '@/lib/api/notifications';
import { authedRequest } from '@/lib/auth/session';
import type { NotificationFeed } from '@/types/notification.types';

const Uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The feed for the bell, which polls it. Null when it can't be read (signed out, the API down). */
export async function loadNotifications(): Promise<NotificationFeed | null> {
  try {
    return await getNotifications();
  } catch (error) {
    if (error instanceof ApiError) return null;
    throw error;
  }
}

export async function markNotificationRead(id: string, read = true): Promise<boolean> {
  if (!Uuid.test(id)) return false;
  try {
    await authedRequest(`/notifications/${id}/read`, { method: 'POST', body: { read } });
    return true;
  } catch (error) {
    if (error instanceof ApiError) return false;
    throw error;
  }
}

export async function markAllNotificationsRead(): Promise<boolean> {
  try {
    await authedRequest('/notifications/read-all', { method: 'POST' });
    return true;
  } catch (error) {
    if (error instanceof ApiError) return false;
    throw error;
  }
}

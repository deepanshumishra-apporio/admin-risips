import 'server-only';

import { authedRequest } from '@/lib/auth/session';
import type {
  AnnouncementAudience,
  AnnouncementCategory,
  AnnouncementDetail,
  AnnouncementList,
  AnnouncementStatus,
  AudienceReach,
} from '@/types/admin-api.types';

export function listAnnouncements(status?: AnnouncementStatus[]): Promise<AnnouncementList> {
  return authedRequest('/announcements', { query: { status } });
}

export function getAnnouncement(id: string): Promise<AnnouncementDetail> {
  return authedRequest(`/announcements/${encodeURIComponent(id)}`);
}

export function getAudienceReach(audience: AnnouncementAudience, category: AnnouncementCategory): Promise<AudienceReach> {
  return authedRequest('/announcements/reach', { query: { audience, category } });
}

import 'server-only';

import { authedRequest } from '@/lib/auth/session';
import type { MeetingStatus, ReviewMeetingList, StaffRef } from '@/types/admin-api.types';

export function listReviewMeetings(query: { status?: MeetingStatus; cursor?: string; limit?: number }): Promise<ReviewMeetingList> {
  return authedRequest('/review-meetings', { query: { status: query.status, cursor: query.cursor, limit: query.limit } });
}

export function listMeetingConductors(): Promise<StaffRef[]> {
  return authedRequest('/review-meetings/conductors');
}

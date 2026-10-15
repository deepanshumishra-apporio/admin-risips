'use server';

import { revalidatePath } from 'next/cache';

import { ApiError } from '@/lib/api/errors';
import { authedRequest } from '@/lib/auth/session';
import type { MeetingInvestorOption, MeetingStatus } from '@/types/admin-api.types';

export type MeetingFormState = { error: string | null; done?: string };

const Uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const Modes = ['IN_PERSON', 'VIDEO', 'PHONE'] as const;
const Profiles = ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'] as const;
const Statuses: readonly MeetingStatus[] = ['SCHEDULED', 'CAPTURED', 'PROFILE_UPDATED'];

const text = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
};

/** API refusals become a message; session redirects from `authedRequest` are rethrown so Next can follow them. */
async function run(call: () => Promise<unknown>, done: string): Promise<MeetingFormState> {
  try {
    await call();
    revalidatePath('/review-meetings');
    return { error: null, done };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

export async function recordMeeting(_previous: MeetingFormState, form: FormData): Promise<MeetingFormState> {
  const userId = text(form, 'userId');
  if (!Uuid.test(userId)) return { error: 'Choose the investor from the search results.' };
  const conductedByStaffId = text(form, 'conductedByStaffId');
  const mode = text(form, 'mode');
  const currentProfile = text(form, 'currentProfile');
  const recommendedProfile = text(form, 'recommendedProfile');
  if (!(Modes as readonly string[]).includes(mode) || !(Profiles as readonly string[]).includes(currentProfile) || !(Profiles as readonly string[]).includes(recommendedProfile)) {
    return { error: 'Choose the mode and both profiles.' };
  }
  const meetingDate = text(form, 'meetingDate');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meetingDate)) return { error: 'Choose the meeting date.' };
  return run(
    () => authedRequest('/review-meetings', {
      method: 'POST',
      body: {
        userId, mode, meetingDate, currentProfile, recommendedProfile, notes: text(form, 'notes'),
        ...(Uuid.test(conductedByStaffId) && { conductedByStaffId }),
      },
    }),
    'Meeting recorded.',
  );
}

/** Move a meeting to its next status, optionally completing its notes. */
export async function advanceMeeting(_previous: MeetingFormState, form: FormData): Promise<MeetingFormState> {
  const meetingId = text(form, 'meetingId');
  const status = text(form, 'status') as MeetingStatus;
  if (!Uuid.test(meetingId) || !Statuses.includes(status)) return { error: 'That change could not be made.' };
  const notes = form.has('notes') ? text(form, 'notes') : undefined;
  return run(
    () => authedRequest(`/review-meetings/${meetingId}`, { method: 'PATCH', body: { status, ...(notes !== undefined && { notes }) } }),
    status === 'PROFILE_UPDATED' ? 'Marked as profile updated. The record is now final.' : 'Meeting captured.',
  );
}

/** The investor picker's search. Empty for fewer than 2 characters. */
export async function searchMeetingInvestors(search: string): Promise<MeetingInvestorOption[]> {
  const query = search.trim();
  if (query.length < 2 || query.length > 100) return [];
  try {
    return await authedRequest<MeetingInvestorOption[]>('/review-meetings/investors', { query: { search: query } });
  } catch (error) {
    if (error instanceof ApiError) return [];
    throw error;
  }
}

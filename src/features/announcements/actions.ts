'use server';

import { revalidatePath } from 'next/cache';

import { getAudienceReach } from '@/lib/api/announcements';
import { ApiError } from '@/lib/api/errors';
import { authedRequest } from '@/lib/auth/session';
import type { AnnouncementAudience, AnnouncementCategory, AnnouncementDetail, AnnouncementInput, AudienceReach } from '@/types/admin-api.types';

const Uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** API refusals become a message; session redirects from `authedRequest` are rethrown so Next can follow them. */
function failure(error: unknown): { id: null; error: string } {
  if (error instanceof ApiError) return { id: null, error: error.message };
  throw error;
}

/** Create a draft, or save changes to one. Returns its id for the redirect. */
export async function saveAnnouncement(id: string | null, input: AnnouncementInput): Promise<{ id: string; error: null } | { id: null; error: string }> {
  if (id !== null && !Uuid.test(id)) return { id: null, error: 'That announcement could not be found.' };
  try {
    const saved = await authedRequest<AnnouncementDetail>(id ? `/announcements/${id}` : '/announcements', {
      method: id ? 'PUT' : 'POST',
      body: input,
    });
    revalidatePath('/announcements');
    return { id: saved.id, error: null };
  } catch (error) {
    return failure(error);
  }
}

export async function reachOf(audience: AnnouncementAudience, category: AnnouncementCategory): Promise<AudienceReach | null> {
  try {
    return await getAudienceReach(audience, category);
  } catch (error) {
    if (error instanceof ApiError) return null;
    throw error;
  }
}

export type TransitionState = { error: string | null; done?: string };

const Done = {
  submit: 'Sent for approval. A colleague has to approve it.',
  approve: 'Approved. It goes out at its start time.',
  reject: 'Rejected. The author can edit it and send it again.',
  cancel: 'Cancelled.',
  end: 'Ended. The banner no longer shows.',
} as const;

export async function transitionAnnouncement(_previous: TransitionState, form: FormData): Promise<TransitionState> {
  const id = String(form.get('id') ?? '');
  const action = String(form.get('action') ?? '') as keyof typeof Done;
  const reason = String(form.get('reason') ?? '').trim();
  if (!Uuid.test(id) || !(action in Done)) return { error: 'That action could not be done.' };
  if (action === 'reject' && !reason) return { error: 'Say why it is being rejected, so the author can fix it.' };
  try {
    await authedRequest(`/announcements/${id}/actions`, { method: 'POST', body: { action, ...(action === 'reject' && { reason }) } });
    revalidatePath(`/announcements/${id}`);
    revalidatePath('/announcements');
    return { error: null, done: Done[action] };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

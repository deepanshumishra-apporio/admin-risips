'use server';

import { revalidatePath } from 'next/cache';

import { ApiError } from '@/lib/api/errors';
import { authedRequest } from '@/lib/auth/session';
import type { ComplianceScanResult } from '@/types/admin-api.types';

export type AlertFormState = { error: string | null; done?: string };

const Uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const Types = ['acknowledge', 'assign', 'resolve', 'dismiss', 'reopen', 'note', 'remind'] as const;
type ActionType = (typeof Types)[number];

const Done: Record<ActionType, string> = {
  acknowledge: 'Acknowledged.',
  assign: 'Assignment saved.',
  resolve: 'Resolved.',
  dismiss: 'Dismissed.',
  reopen: 'Reopened.',
  note: 'Note added.',
  remind: 'Reminder sent to the investor in the app.',
};

const text = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
};

/**
 * One action on an alert, from a form: `type`, and `note` or `assigneeId`
 * where the action takes one. API refusals become a message; session
 * redirects from `authedRequest` are rethrown so Next can follow them.
 */
export async function actOnAlert(_previous: AlertFormState, form: FormData): Promise<AlertFormState> {
  const alertId = text(form, 'alertId');
  const type = text(form, 'type') as ActionType;
  if (!Uuid.test(alertId) || !Types.includes(type)) return { error: 'That action could not be done.' };
  const note = text(form, 'note');
  if ((type === 'resolve' || type === 'dismiss' || type === 'note') && !note) {
    return { error: type === 'note' ? 'Write the note first.' : 'Say how this was handled — it is the compliance record.' };
  }
  const body =
    type === 'assign'
      ? { type, assigneeId: text(form, 'assigneeId') || null }
      : type === 'resolve' || type === 'dismiss' || type === 'note' || (type === 'reopen' && note)
        ? { type, note }
        : { type };
  try {
    await authedRequest(`/compliance/alerts/${alertId}/actions`, { method: 'POST', body });
    revalidatePath(`/compliance/${alertId}`);
    revalidatePath('/compliance');
    return { error: null, done: Done[type] };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

/** "Run checks now": one scan straight away instead of waiting for the next scheduled one. */
export async function runChecks(): Promise<{ error: string | null; result: ComplianceScanResult | null }> {
  try {
    const result = await authedRequest<ComplianceScanResult>('/compliance/scan', { method: 'POST' });
    revalidatePath('/compliance');
    return { error: null, result };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message, result: null };
    throw error;
  }
}

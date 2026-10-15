'use server';

import { revalidatePath } from 'next/cache';

import { nudgeInvestors } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/errors';
import type { NudgeResult } from '@/types/admin-api.types';

const Uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MaxBatch = 500;

export type NudgeOutcome = { result: NudgeResult; error: null } | { result: null; error: string };

/**
 * Send each investor a reminder worded for where they stopped. The API skips
 * anyone invested, opted out or nudged this week, and says how many.
 */
export async function nudge(userIds: string[]): Promise<NudgeOutcome> {
  const ids = [...new Set(userIds)].filter((id) => Uuid.test(id));
  if (ids.length === 0) return { result: null, error: 'Pick at least one investor to nudge.' };
  if (ids.length > MaxBatch) return { result: null, error: `Nudge at most ${MaxBatch} investors at a time.` };
  try {
    const result = await nudgeInvestors(ids);
    revalidatePath('/investors');
    return { result, error: null };
  } catch (error) {
    if (error instanceof ApiError) return { result: null, error: error.message };
    throw error;
  }
}

import 'server-only';

import { apiRequest } from '@/lib/api/client';
import { authedRequest } from '@/lib/auth/session';
import type { HufConsentView, HufDetail, HufList, HufOptions, HufStatus } from '@/types/admin-api.types';

export function listHufs(query: { status?: HufStatus[]; search?: string; cursor?: string; limit?: number } = {}): Promise<HufList> {
  return authedRequest('/hufs', { query });
}

export function getHuf(id: string): Promise<HufDetail> {
  return authedRequest(`/hufs/${encodeURIComponent(id)}`);
}

export function getHufOptions(): Promise<HufOptions> {
  return authedRequest('/hufs/options');
}

/** The karta's consent page. No staff session: the token in the link is the key. */
export function getHufConsent(token: string): Promise<HufConsentView> {
  return apiRequest(`/public/huf-consent/${encodeURIComponent(token)}`);
}

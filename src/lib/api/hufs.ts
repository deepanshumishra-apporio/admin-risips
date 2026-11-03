import 'server-only';

import { apiRequest } from '@/lib/api/client';
import { authedRequest } from '@/lib/auth/session';
import type { HufConsentView, HufDetail, HufInvestmentsView, HufList, HufOptions, HufScheme, HufStatus } from '@/types/admin-api.types';

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

export function getHufInvestments(id: string): Promise<HufInvestmentsView> {
  return authedRequest(`/hufs/${encodeURIComponent(id)}/investments`);
}

/** Schemes open for purchase whose name or code has every word searched for (at least 3 letters). */
export function searchHufSchemes(search: string): Promise<HufScheme[]> {
  return authedRequest('/hufs/schemes', { query: { search } });
}

/** One fund as NSE's masters describe it. */
export function getHufScheme(code: string): Promise<HufScheme> {
  return authedRequest(`/hufs/schemes/${encodeURIComponent(code)}`);
}

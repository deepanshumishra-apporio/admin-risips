import 'server-only';

import { authedRequest } from '@/lib/auth/session';
import type { SipDetail, SipList, SipSummary } from '@/types/admin-api.types';

export type SipQuery = { search?: string; status?: string[]; frequency?: string[]; amc?: string; sort?: string; cursor?: string; limit?: number };

export function getSipSummary(): Promise<SipSummary> {
  return authedRequest('/sips/summary');
}

export function listSips(query: SipQuery): Promise<SipList> {
  return authedRequest('/sips', { query });
}

export function getSip(id: string): Promise<SipDetail> {
  return authedRequest(`/sips/${encodeURIComponent(id)}`);
}

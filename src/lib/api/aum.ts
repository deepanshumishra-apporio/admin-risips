import 'server-only';

import { authedRequest } from '@/lib/auth/session';
import type { AumList, AumSummary } from '@/types/admin-api.types';

export type AumQuery = { search?: string; assetClass?: string; amc?: string; sort?: string; cursor?: string; limit?: number };

export function getAumSummary(query: AumQuery): Promise<AumSummary> {
  return authedRequest('/aum/summary', { query });
}

export function listAum(query: AumQuery): Promise<AumList> {
  return authedRequest('/aum', { query });
}

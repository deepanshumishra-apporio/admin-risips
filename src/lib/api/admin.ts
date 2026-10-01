import 'server-only';

import { authedRequest } from '@/lib/auth/session';
import type {
  DashboardSummary,
  InvestorDetail,
  InvestorItem,
  InvestorItemType,
  InvestorList,
  InvestorListQuery,
  SignupBucket,
  SignupSeries,
} from '@/types/admin-api.types';

export function getDashboardSummary(): Promise<DashboardSummary> {
  return authedRequest('/dashboard/summary');
}

export function getSignupSeries(params: { from?: string; to?: string; bucket?: SignupBucket } = {}): Promise<SignupSeries> {
  return authedRequest('/dashboard/signups', { query: params });
}

export function listInvestors(query: InvestorListQuery): Promise<InvestorList> {
  return authedRequest('/investors', {
    query: {
      search: query.search,
      stage: query.stage,
      kycStatus: query.kycStatus,
      kycStalled: query.kycStalled ? 'true' : undefined,
      sipDueDays: query.sipDueDays,
      cursor: query.cursor,
      limit: query.limit,
    },
  });
}

export function getInvestor(userId: string): Promise<InvestorDetail> {
  return authedRequest(`/investors/${encodeURIComponent(userId)}`);
}

export function getInvestorItem(userId: string, type: InvestorItemType, itemId: string): Promise<InvestorItem> {
  return authedRequest(`/investors/${encodeURIComponent(userId)}/items/${type}/${encodeURIComponent(itemId)}`);
}

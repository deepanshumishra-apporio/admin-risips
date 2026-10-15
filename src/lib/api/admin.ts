import 'server-only';

import { authedRequest } from '@/lib/auth/session';
import type {
  DashboardSummary,
  InvestorDetail,
  InvestorItem,
  InvestorItemType,
  InvestorList,
  InvestorListQuery,
  InvestorOverview,
  NudgeResult,
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
      attention: query.attention,
      cursor: query.cursor,
      limit: query.limit,
    },
  });
}

/** The stage counts and the counts behind the list's quick filters. */
export function getInvestorOverview(): Promise<InvestorOverview> {
  return authedRequest('/investors/overview');
}

/** A reminder notification to each investor, worded for their stage. */
export function nudgeInvestors(userIds: string[]): Promise<NudgeResult> {
  return authedRequest('/investors/nudge', { method: 'POST', body: { userIds } });
}

export function getInvestor(userId: string): Promise<InvestorDetail> {
  return authedRequest(`/investors/${encodeURIComponent(userId)}`);
}

export function getInvestorItem(userId: string, type: InvestorItemType, itemId: string): Promise<InvestorItem> {
  return authedRequest(`/investors/${encodeURIComponent(userId)}/items/${type}/${encodeURIComponent(itemId)}`);
}

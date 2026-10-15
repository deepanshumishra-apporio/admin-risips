import 'server-only';

import { getDashboardSummary, getInvestorOverview, listInvestors } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/errors';
import { hasPermission } from '@/lib/auth/session';
import { JourneyStages, type InvestorListQuery, type InvestorOverview, type JourneyStage } from '@/types/admin-api.types';

/**
 * The investor list's header counts. They come from `/investors/overview`; an
 * API from before that route answers 404, and then the same numbers are
 * counted here from the list itself — one `limit=1` read per count, whose
 * `total` is the number. Slower, so only ever the fallback.
 *
 * Null only when even the list cannot be read, and then the page shows the
 * list's own error rather than a header.
 */
export async function loadInvestorOverview(): Promise<InvestorOverview | null> {
  try {
    return await getInvestorOverview();
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.status !== 404) {
      console.error('[investors] overview unavailable', error.status, error.code, error.message);
      return null;
    }
  }
  try {
    return await countFromList();
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    console.error('[investors] overview could not be counted', error.status, error.code, error.message);
    return null;
  }
}

const total = (query: Omit<InvestorListQuery, 'limit'>) => listInvestors({ ...query, limit: 1 }).then((list) => list.total);

async function countFromList(): Promise<InvestorOverview> {
  const [all, stageCounts, kycPending, kycStalled, kycBlocked, setup, sipDue, activeSips] = await Promise.all([
    total({}),
    Promise.all(JourneyStages.map((stage) => total({ stage: [stage] }))),
    total({ kycStatus: ['NOT_STARTED', 'PAN_CHECK_FAILED', 'IN_PROGRESS', 'FAILED', 'EXPIRED'] }),
    total({ kycStalled: true }),
    total({ stage: ['KYC'], kycStatus: ['PAN_CHECK_FAILED', 'FAILED', 'EXPIRED'] }),
    total({ stage: ['ACCOUNT_SETUP'] }),
    total({ sipDueDays: 7 }),
    // Only the dashboard knows the platform's active SIPs; without that permission the card says less.
    hasPermission('dashboard.read').then((allowed) =>
      allowed ? getDashboardSummary().then((summary) => summary.investments.activeSips) : null,
    ),
  ]);

  const byStage = Object.fromEntries(JourneyStages.map((stage, index) => [stage, stageCounts[index] ?? 0])) as Record<JourneyStage, number>;
  return {
    total: all,
    byStage,
    kycPending,
    kycStalled,
    // Blocked in KYC: a check that did not pass, or a form that stopped moving.
    // Stalled forms are IN_PROGRESS, so the two counts never overlap.
    attention: { KYC: kycBlocked + kycStalled, SETUP: setup },
    activeSips,
    sipDueIn7Days: sipDue,
    countedFromList: true,
  };
}

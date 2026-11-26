import type { Metadata } from 'next';

import { PageHeader } from '@/components/layout/page-header';
import { NoAccess } from '@/components/ui/no-access';
import { AssetBreakup } from '@/features/dashboard/components/asset-breakup';
import { AumGrowth } from '@/features/dashboard/components/aum-growth';
import { InvestorSummary } from '@/features/dashboard/components/investor-summary';
import { MetricSection } from '@/features/dashboard/components/metric-section';
import { NeedsAttention } from '@/features/dashboard/components/needs-attention';
import { RecentInvestors } from '@/features/dashboard/components/recent-investors';
import { SipDistribution } from '@/features/dashboard/components/sip-distribution';
import { getDashboardSummary } from '@/lib/api/admin';
import { hasPermission } from '@/lib/auth/session';
import { formatCount, formatDateTime, formatInrString } from '@/utils/format';

export const metadata: Metadata = { title: 'Dashboard · RiSips Admin' };

export default async function DashboardPage(): Promise<React.JSX.Element> {
  if (!(await hasPermission('dashboard.read'))) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <NoAccess what="dashboard metrics" />
      </>
    );
  }

  const summary = await getDashboardSummary();
  const o = summary.overview;
  if (!o) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <p className="text-[13.5px] text-ink-muted">The admin API is out of date for this dashboard. Deploy the latest admin backend.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          o.valuedAt
            ? `Holdings valued ${formatDateTime(o.valuedAt)}; they refresh every 15 minutes.`
            : 'Holdings are being valued for the first time. AUM fills in within a few minutes.'
        }
      />

      <div className="space-y-6">
        <MetricSection
          title="Business metrics"
          metrics={[
            { label: 'Total AUM', value: formatInrString(o.business.aum), hint: 'Current market value of every investor’s holdings, from the last valuation.', href: '/orders/aum' },
            { label: 'Active SIPs', value: formatCount(o.business.activeSips), caption: `${formatInrString(summary.investments.activeSipMonthlyAmount)} a month`, href: '/orders/sips' },
            { label: 'Active investors', value: formatCount(o.business.activeInvestors), hint: 'Holds units or has a running SIP.', href: '/investors?active=true' },
          ]}
        />

        <MetricSection
          title="Investor metrics"
          metrics={[
            { label: 'New investors', value: formatCount(o.investors.newThisMonth), caption: `This month · ${formatCount(o.investors.newLast30Days)} in the last 30 days`, href: '/investors?joined=month' },
            { label: 'Pending KYC', value: formatCount(o.investors.pendingKyc), hint: 'Signed up, KYC not started or not finished.', href: '/investors?kyc=NOT_STARTED,IN_PROGRESS' },
            {
              label: 'KYC rejections',
              value: formatCount(o.investors.kycRejections),
              hint: 'KYC failed or expired, or the PAN check did not pass.',
              href: '/investors?kyc=FAILED,EXPIRED,PAN_CHECK_FAILED',
            },
          ]}
        />

        {o.support ? (
          <MetricSection
            title="Support metrics"
            columns={2}
            metrics={[
              { label: 'Open tickets', value: formatCount(o.support.open), href: '/support' },
              { label: 'Escalated tickets', value: formatCount(o.support.escalated), hint: 'Open tickets that are urgent or past their SLA.', href: '/support' },
            ]}
          />
        ) : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <AssetBreakup classes={o.assetClasses} />
          <InvestorSummary investors={o.investors} asOf={summary.dataAsOf} />
          <SipDistribution months={o.sipMonths} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AumGrowth months={o.aumMonths} />
          </div>
          <NeedsAttention queues={o.queues} />
        </div>

        <RecentInvestors investors={o.recentInvestors} />
      </div>
    </>
  );
}

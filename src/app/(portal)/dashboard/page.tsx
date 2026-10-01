import type { Metadata } from 'next';

import { PageHeader } from '@/components/layout/page-header';
import { NoAccess } from '@/components/ui/no-access';
import { AttentionPanel } from '@/features/dashboard/components/attention-panel';
import { JourneyStages } from '@/features/dashboard/components/journey-stages';
import { KycBreakdown } from '@/features/dashboard/components/kyc-breakdown';
import { OnboardingFunnel } from '@/features/dashboard/components/onboarding-funnel';
import { SignupTrend } from '@/features/dashboard/components/signup-trend';
import { SummaryKpis } from '@/features/dashboard/components/summary-kpis';
import { getDashboardSummary, getSignupSeries } from '@/lib/api/admin';
import { hasPermission } from '@/lib/auth/session';
import { formatDateTime } from '@/utils/format';

export const metadata: Metadata = { title: 'Dashboard · RiSips Admin' };

/** Twelve weeks back from today, as the API's India-local dates. */
function trendRange(): { from: string; to: string } {
  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const to = istNow.toISOString().slice(0, 10);
  const from = new Date(istNow.getTime() - 83 * 86_400_000).toISOString().slice(0, 10);
  return { from, to };
}

export default async function DashboardPage(): Promise<React.JSX.Element> {
  if (!(await hasPermission('dashboard.read'))) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <NoAccess what="dashboard metrics" />
      </>
    );
  }

  const [summary, series] = await Promise.all([
    getDashboardSummary(),
    getSignupSeries({ ...trendRange(), bucket: 'week' }),
  ]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          summary.dataAsOf
            ? `Signups, KYC and investments across every investor. Investor figures as of ${formatDateTime(summary.dataAsOf)}; they refresh every minute.`
            : 'Investor figures are being prepared for the first time. Refresh in a minute.'
        }
      />

      <SummaryKpis summary={summary} />

      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <SignupTrend series={series} />
          </div>
          <AttentionPanel attention={summary.attention} />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <OnboardingFunnel funnel={summary.funnel} />
          <KycBreakdown kyc={summary.kyc} />
          <JourneyStages summary={summary} />
        </div>
      </div>
    </>
  );
}

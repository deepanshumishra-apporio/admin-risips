import { StatStrip } from '@/components/ui/stat-strip';
import type { DashboardSummary } from '@/types/admin-api.types';
import { formatCount, formatInrString, formatPercent } from '@/utils/format';

const share = (part: number, whole: number): string => (whole ? formatPercent((part / whole) * 100) : '0%');

export function SummaryKpis({ summary }: { summary: DashboardSummary }): React.JSX.Element {
  const { signups, kyc, journey, investments } = summary;
  const stage = (key: string): number => journey.byStage.find((entry) => entry.key === key)?.count ?? 0;
  const ready = stage('READY_TO_INVEST') + stage('INVESTED');

  return (
    <StatStrip
      items={[
        {
          label: 'Signups',
          hint: 'Investor accounts created, all time.',
          value: formatCount(signups.total),
          caption: `${formatCount(signups.last7Days)} in the last 7 days · ${formatCount(signups.today)} today`,
        },
        {
          label: 'KYC completed',
          hint: 'Verified at the KRA, or a digital KYC form submitted with us.',
          value: formatCount(kyc.completed),
          caption: `${share(kyc.completed, signups.total)} of signups · ${formatCount(kyc.completedVia.kycForm)} via our form`,
        },
        {
          label: 'Ready to invest',
          hint: 'Identity verified and a verified payout bank account.',
          value: formatCount(ready),
          caption: `${share(ready, signups.total)} of signups`,
        },
        {
          label: 'Invested',
          value: formatCount(investments.investedInvestors),
          caption: `${formatCount(investments.successfulPurchases)} successful purchases`,
        },
        {
          label: 'Current value',
          hint: 'From the latest holdings sync, not a sum of orders.',
          value: formatInrString(investments.currentValue),
          caption: `${formatInrString(investments.purchasedAmount)} purchased`,
        },
        {
          label: 'Active SIPs',
          value: formatCount(investments.activeSips),
          caption: `${formatInrString(investments.activeSipMonthlyAmount)} a month`,
        },
      ]}
    />
  );
}

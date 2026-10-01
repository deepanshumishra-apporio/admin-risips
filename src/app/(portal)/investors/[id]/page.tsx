import { ArrowLeft, LifeBuoy } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { NoAccess } from '@/components/ui/no-access';
import { SectionTabs } from '@/components/ui/section-tabs';
import { StatStrip } from '@/components/ui/stat-strip';
import { AccountsPanel } from '@/features/investors/components/detail/accounts-panel';
import { ContactCard } from '@/features/investors/components/detail/contact-card';
import { HoldingsPanel } from '@/features/investors/components/detail/holdings-panel';
import { ItemPanelProvider } from '@/features/investors/components/item-panel/item-panel';
import { KycPanel } from '@/features/investors/components/detail/kyc-panel';
import { OrdersPanel } from '@/features/investors/components/detail/orders-panel';
import { OverviewPanel } from '@/features/investors/components/detail/overview-panel';
import { PaymentsPanel } from '@/features/investors/components/detail/payments-panel';
import { PlansPanel } from '@/features/investors/components/detail/plans-panel';
import { TimelinePanel } from '@/features/investors/components/detail/timeline-panel';
import { KycLabel, NextStepLabel, StageLabel } from '@/features/investors/labels';
import { isLivePlan } from '@/features/investors/money-labels';
import { getInvestor } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/errors';
import { hasPermission } from '@/lib/auth/session';
import type { InvestorDetail } from '@/types/admin-api.types';
import { formatCount, formatDate, formatInrString, timeAgo } from '@/utils/format';
import { JourneyStageTone, KycStatusTone } from '@/utils/tone';

export const metadata: Metadata = { title: 'Investor · RiSips Admin' };

type InvestorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function InvestorPage({ params }: InvestorPageProps): Promise<React.JSX.Element> {
  if (!(await hasPermission('investors.read'))) {
    return (
      <>
        <PageHeader title="Investor" />
        <NoAccess what="investor records" />
      </>
    );
  }

  const { id } = await params;
  let detail: InvestorDetail;
  try {
    detail = await getInvestor(id);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  const { summary, investments } = detail;
  const canRaiseTicket = await hasPermission('support.manage');
  const { portfolio, plans, summary: money } = investments;
  const gain = Number(portfolio.gain);
  const livePlans = [...plans.sips, ...plans.swps, ...plans.stps].filter((plan) => isLivePlan(plan.state)).length;
  const kycCaption = summary.kycNextStep
    ? NextStepLabel[summary.kycNextStep]
    : summary.kycCompletedVia === 'KRA'
      ? 'Verified at the KRA'
      : summary.kycCompletedVia === 'KYC_FORM'
        ? 'Via our digital KYC form'
        : undefined;

  return (
    <>
      <Link href="/investors" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-3.5" />
        Investors
      </Link>

      <PageHeader
        title={summary.name ?? 'Unnamed investor'}
        description={`Signed up ${formatDate(summary.signedUpAt)} · Last active ${timeAgo(summary.lastActivityAt)}`}
        actions={
          <>
            <Badge tone={JourneyStageTone[summary.stage]} dot>
              {StageLabel[summary.stage]}
            </Badge>
            <Badge tone={KycStatusTone[summary.kycStatus]}>KYC: {KycLabel[summary.kycStatus]}</Badge>
            {canRaiseTicket ? (
              <Link
                href={`/support/new?${new URLSearchParams({ investor: summary.id, name: summary.name ?? '' }).toString()}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 text-[13px] font-medium text-ink transition-colors hover:bg-surface-sunken"
              >
                <LifeBuoy className="size-4" />
                Raise ticket
              </Link>
            ) : null}
          </>
        }
      />

      <StatStrip
        className="mb-5"
        items={[
          {
            label: 'Current value',
            hint: 'From the latest RTA holdings report.',
            value: formatInrString(portfolio.currentValue),
            caption: portfolio.asOf ? `as of ${formatDate(portfolio.asOf)}` : 'nothing allotted yet',
          },
          {
            label: 'Invested',
            value: formatInrString(portfolio.investedValue),
            caption:
              Number(portfolio.investedValue) > 0
                ? `${gain >= 0 ? '+' : '−'}${formatInrString(String(Math.abs(gain)))} (${portfolio.gainPercent ?? '0.00'}%)`
                : 'cost of units held',
          },
          {
            label: 'Active SIPs',
            value: formatCount(money.activeSips),
            caption: `${formatInrString(money.sipMonthlyAmount, { compact: false })} a month`,
          },
          {
            label: 'Next SIP',
            value: money.nextSip ? formatDate(money.nextSip.date) : '—',
            caption: money.nextSip
              ? `${formatInrString(money.nextSip.amount, { compact: false })}${money.nextSip.count > 1 ? ` across ${money.nextSip.count} SIPs` : ''}`
              : 'none scheduled',
          },
          {
            label: 'SWP · STP',
            value: `${formatCount(money.activeSwps)} · ${formatCount(money.activeStps)}`,
            caption: 'active withdrawal · transfer plans',
          },
          { label: 'KYC', value: KycLabel[summary.kycStatus], ...(kycCaption && { caption: kycCaption }) },
        ]}
      />

      {/* grid-cols-1 is minmax(0,1fr): without it the column grows to the tables' min width and the page scrolls sideways. */}
      <ItemPanelProvider userId={summary.id}>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SectionTabs
          tabs={[
            { label: 'Overview', content: <OverviewPanel investments={investments} /> },
            {
              label: 'Holdings',
              count: portfolio.holdings.length || undefined,
              content: <HoldingsPanel investments={investments} />,
            },
            { label: 'SIP · SWP · STP', count: livePlans || undefined, content: <PlansPanel plans={plans} /> },
            { label: 'Orders', count: investments.orders.length || undefined, content: <OrdersPanel orders={investments.orders} /> },
            {
              label: 'Payments',
              count: investments.payments.length || undefined,
              content: <PaymentsPanel payments={investments.payments} />,
            },
            { label: 'KYC', count: detail.kyc.forms.length || undefined, content: <KycPanel kyc={detail.kyc} /> },
            {
              label: 'Bank & nominees',
              count: detail.bankAccounts.length || undefined,
              content: <AccountsPanel bankAccounts={detail.bankAccounts} nomination={detail.nomination} mandates={detail.mandates} />,
            },
            { label: 'Timeline', content: <TimelinePanel timeline={detail.timeline} /> },
          ]}
        />

        <ContactCard detail={detail} />
      </div>
      </ItemPanelProvider>
    </>
  );
}

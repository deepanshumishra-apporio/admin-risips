'use client';

import { useState } from 'react';

import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Tabs } from '@/components/ui/tabs';
import type { AccountType, CountByKey } from '@/types/admin-api.types';
import { formatCount, formatPercent } from '@/utils/format';

const Views = ['All', 'Individuals', 'HUFs'] as const;
type View = (typeof Views)[number];
const ViewType: Record<Exclude<View, 'All'>, AccountType> = { Individuals: 'INDIVIDUAL', HUFs: 'HUF' };

type OnboardingFunnelProps = {
  funnel: CountByKey[];
  /** Absent from an API that predates HUFs; then only "All" is shown. */
  byAccountType?: Record<AccountType, CountByKey[]> | undefined;
};

/**
 * Each milestone as a share of signups. Counted independently, so the drop between two rows is real.
 * Individuals and HUFs can be looked at apart once any HUF has been added.
 */
export function OnboardingFunnel({ funnel, byAccountType }: OnboardingFunnelProps): React.JSX.Element {
  const [view, setView] = useState<View>('All');
  const split = byAccountType && (byAccountType.HUF[0]?.count ?? 0) > 0 ? byAccountType : null;
  const shown = view === 'All' || !split ? funnel : split[ViewType[view]];
  const top = shown[0]?.count ?? 0;

  return (
    <Card>
      <CardHeader
        title="Onboarding funnel"
        subtitle={
          view === 'HUFs'
            ? "HUFs added by a karta. KYC is the KRA check on the HUF's PAN"
            : 'How far signups get, as a share of everyone who signed up'
        }
        {...(split && { action: <Tabs tabs={Views} active={view} onChange={setView} size="sm" /> })}
      />
      <CardBody>
        <ol className="space-y-3.5">
          {shown.map((step) => {
            const pct = top ? (step.count / top) * 100 : 0;
            return (
              <li key={step.key}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-medium text-ink">{step.label}</span>
                  <span className="tabular text-[12.5px] text-ink-muted">
                    <span className="font-semibold text-ink">{formatCount(step.count)}</span> · {formatPercent(pct)}
                  </span>
                </div>
                <ProgressBar value={pct} />
              </li>
            );
          })}
        </ol>
      </CardBody>
    </Card>
  );
}

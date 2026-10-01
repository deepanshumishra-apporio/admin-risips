import Link from 'next/link';

import { DonutChart } from '@/components/charts/donut-chart';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import type { DashboardSummary, KycStatus } from '@/types/admin-api.types';
import { formatCount } from '@/utils/format';

const StatusColor: Record<KycStatus, string> = {
  COMPLETED: 'var(--color-success)',
  IN_PROGRESS: 'var(--color-warn)',
  NOT_STARTED: 'var(--color-line-strong)',
  PAN_CHECK_FAILED: 'var(--color-violet)',
  FAILED: 'var(--color-danger)',
  EXPIRED: 'var(--color-ink-muted)',
};

export function KycBreakdown({ kyc }: { kyc: DashboardSummary['kyc'] }): React.JSX.Element {
  const total = kyc.byStatus.reduce((sum, entry) => sum + entry.count, 0);
  const openForms = kyc.inProgressByStep.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <Card>
      <CardHeader title="KYC status" subtitle="Every investor's latest identity check or KYC form" />
      <CardBody className="space-y-5">
        <div className="flex flex-wrap items-center gap-6">
          <DonutChart
            size={150}
            centerValue={formatCount(kyc.completed)}
            centerLabel="completed"
            slices={kyc.byStatus.filter((entry) => entry.count > 0).map((entry) => ({
              label: entry.label,
              value: entry.count,
              color: StatusColor[entry.key],
            }))}
          />
          <ul className="min-w-[180px] flex-1 space-y-2">
            {kyc.byStatus.map((entry) => (
              <li key={entry.key}>
                <Link
                  href={`/investors?kyc=${entry.key}`}
                  className="flex items-center justify-between gap-3 rounded-md px-1.5 py-0.5 text-[13px] hover:bg-surface-sunken"
                >
                  <span className="flex items-center gap-2 text-ink-soft">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: StatusColor[entry.key] }} />
                    {entry.label}
                  </span>
                  <span className="tabular font-semibold text-ink">
                    {formatCount(entry.count)}
                    <span className="ml-1.5 font-normal text-ink-muted">
                      {total ? `${Math.round((entry.count / total) * 100)}%` : ''}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-line pt-4">
          <p className="mb-2 text-[12.5px] font-medium text-ink-soft">
            Open KYC forms <span className="tabular text-ink-muted">· {formatCount(openForms)}</span>
          </p>
          {openForms === 0 ? (
            <p className="text-[12.5px] text-ink-muted">No KYC form is open right now.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {kyc.inProgressByStep.map((step) => (
                <li key={step.key} className="flex justify-between text-[12.5px]">
                  <span className="text-ink-muted">{step.label}</span>
                  <span className="tabular font-medium text-ink">{formatCount(step.count)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

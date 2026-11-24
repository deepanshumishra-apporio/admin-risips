import { BarChart } from '@/components/charts/bar-chart';
import { ChartLegend } from '@/components/charts/legend';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { monthLabel } from '@/features/dashboard/components/sip-distribution';
import type { DashboardOverview } from '@/types/admin-api.types';
import { formatInr } from '@/utils/format';

/**
 * AUM over the last 12 months. Market values weren't kept for past months, so those bars are the net amount invested
 * at the month's end; this month's bar is the current market value.
 */
export function AumGrowth({ months }: { months: DashboardOverview['aumMonths'] }): React.JSX.Element {
  return (
    <Card className="flex flex-col">
      <CardHeader title="AUM growth, last 12 months" subtitle="Past months: net invested at month end · this month: market value" />
      <CardBody className="space-y-2">
        <ChartLegend
          items={[
            { label: 'Net invested', color: 'var(--color-brand)' },
            { label: 'Market value (now)', color: 'var(--color-violet)' },
          ]}
        />
        <BarChart
          data={months.map((m) => {
            const value = Number(m.value);
            const market = m.basis === 'MARKET_VALUE';
            return {
              label: monthLabel(m.month),
              value,
              color: market ? 'var(--color-violet)' : undefined,
              title: `${monthLabel(m.month)}: ${formatInr(value)} ${market ? 'market value' : 'net invested'}`,
            };
          })}
        />
      </CardBody>
    </Card>
  );
}

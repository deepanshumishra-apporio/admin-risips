import Link from 'next/link';

import { GroupedBarChart } from '@/components/charts/grouped-bar-chart';
import { ChartLegend } from '@/components/charts/legend';
import { LineChart } from '@/components/charts/line-chart';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import type { DashboardOverview } from '@/types/admin-api.types';
import { formatCount, formatInr } from '@/utils/format';

export const monthLabel = (month: string): string =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' });

const Started = 'var(--color-success)';
const Running = 'var(--color-brand)';
const Lumpsum = 'var(--color-violet)';

/** SIPs started and running each month, and the money that came in through SIPs against lumpsums. */
export function SipDistribution({ months }: { months: DashboardOverview['sipMonths'] }): React.JSX.Element {
  const labels = months.map((m) => monthLabel(m.month));
  return (
    <Card className="flex flex-col">
      <CardHeader title="Month-wise SIP distribution" subtitle="Last 6 months" action={<Link href="/orders/sips" className="text-[13px] font-semibold text-brand hover:underline">View SIPs</Link>} />
      <CardBody className="space-y-5">
        <div className="space-y-2">
          <ChartLegend items={[{ label: 'Started', color: Started }, { label: 'Running', color: Running }]} />
          <GroupedBarChart
            labels={labels}
            series={[{ key: 'started', label: 'Started', color: Started }, { key: 'running', label: 'Running', color: Running }]}
            values={{ started: months.map((m) => m.started), running: months.map((m) => m.running) }}
            valueFormatter={(v) => `${formatCount(v)} SIPs`}
            width={340}
            height={140}
          />
        </div>
        <div className="space-y-2 border-t border-line pt-4">
          <p className="text-[13.5px] font-semibold text-ink">SIP vs Lumpsum</p>
          <ChartLegend items={[{ label: 'SIP', color: Running }, { label: 'Lumpsum', color: Lumpsum }]} />
          <LineChart
            labels={labels}
            series={[{ key: 'sip', label: 'SIP', color: Running }, { key: 'lumpsum', label: 'Lumpsum', color: Lumpsum }]}
            values={{ sip: months.map((m) => Number(m.sipAmount)), lumpsum: months.map((m) => Number(m.lumpsumAmount)) }}
            valueFormatter={(v) => formatInr(v)}
            width={340}
            height={130}
          />
        </div>
      </CardBody>
    </Card>
  );
}

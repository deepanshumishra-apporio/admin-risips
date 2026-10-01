import { AreaChart } from '@/components/charts/area-chart';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import type { SignupSeries } from '@/types/admin-api.types';
import { formatCount } from '@/utils/format';

const weekLabel = (date: string): string =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'UTC' });

export function SignupTrend({ series }: { series: SignupSeries }): React.JSX.Element {
  const signups = series.points.reduce((sum, point) => sum + point.signups, 0);
  const kycCompleted = series.points.reduce((sum, point) => sum + point.kycCompleted, 0);

  return (
    <Card>
      <CardHeader
        title="Signups"
        subtitle={`Weekly, India time · ${formatCount(signups)} signups and ${formatCount(kycCompleted)} KYC completions in this range`}
      />
      <CardBody>
        <AreaChart
          data={series.points.map((point) => ({ label: weekLabel(point.date), value: point.signups }))}
          valueFormatter={(value) => `${formatCount(value)} signups`}
        />
      </CardBody>
    </Card>
  );
}

import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import type { CountByKey } from '@/types/admin-api.types';
import { formatCount, formatPercent } from '@/utils/format';

/** Each milestone as a share of signups. Counted independently, so the drop between two rows is real. */
export function OnboardingFunnel({ funnel }: { funnel: CountByKey[] }): React.JSX.Element {
  const top = funnel[0]?.count ?? 0;

  return (
    <Card>
      <CardHeader title="Onboarding funnel" subtitle="How far signups get, as a share of everyone who signed up" />
      <CardBody>
        <ol className="space-y-3.5">
          {funnel.map((step) => {
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

import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import type { DashboardSummary } from '@/types/admin-api.types';
import { formatCount } from '@/utils/format';
import { JourneyStageTone } from '@/utils/tone';

/** Where each investor is right now: every investor sits in exactly one stage. */
export function JourneyStages({ summary }: { summary: DashboardSummary }): React.JSX.Element {
  const { byStage } = summary.journey;
  const total = byStage.reduce((sum, stage) => sum + stage.count, 0);

  return (
    <Card>
      <CardHeader title="Where investors are now" subtitle={`${formatCount(total)} investors, each in their furthest stage`} />
      <ul className="divide-y divide-line">
        {byStage.map((stage) => (
          <li key={stage.key}>
            <Link
              href={`/investors?stage=${stage.key}`}
              className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-surface-sunken"
            >
              <Badge tone={JourneyStageTone[stage.key]} dot>
                {stage.label}
              </Badge>
              <span className="tabular text-[13.5px] font-semibold text-ink">{formatCount(stage.count)}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="border-t border-line px-4 py-3">
        <p className="mb-2 text-[12.5px] font-medium text-ink-soft">Mandates</p>
        <ul className="flex flex-wrap gap-x-5 gap-y-1">
          {summary.investments.mandatesByStatus
            .filter((mandate) => mandate.count > 0)
            .map((mandate) => (
              <li key={mandate.key} className="text-[12.5px] text-ink-muted">
                {mandate.label} <span className="tabular font-semibold text-ink">{formatCount(mandate.count)}</span>
              </li>
            ))}
        </ul>
      </div>
    </Card>
  );
}

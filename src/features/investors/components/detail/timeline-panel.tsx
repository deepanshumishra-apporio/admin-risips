import { Card, CardBody, CardHeader } from '@/components/ui/card';
import type { InvestorDetail } from '@/types/admin-api.types';
import { formatDateTime } from '@/utils/format';

export function TimelinePanel({ timeline }: { timeline: InvestorDetail['timeline'] }): React.JSX.Element {
  return (
    <Card>
      <CardHeader title="Timeline" />
      <CardBody>
        {timeline.length === 0 ? (
          <p className="text-[13px] text-ink-muted">Nothing recorded yet.</p>
        ) : (
          <ol className="relative space-y-4 border-l border-line pl-5">
            {timeline.map((entry) => (
              <li key={`${entry.at}-${entry.event}`} className="relative">
                <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-surface bg-brand" />
                <p className="text-[13.5px] font-medium text-ink">{entry.event}</p>
                <p className="text-[12px] text-ink-muted">{formatDateTime(entry.at)}</p>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}

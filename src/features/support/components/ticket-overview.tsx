import { AlertTriangle, ArrowRight, CircleCheck } from 'lucide-react';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import type { TicketListItem, TicketSummary } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatCount } from '@/utils/format';

const HourMs = 3_600_000;
const DayMs = 24 * HourMs;

/** "9 days" / "5 hours" / "under an hour". */
export function spanText(ms: number): string {
  if (ms >= 2 * DayMs) return `${Math.floor(ms / DayMs)} days`;
  if (ms >= DayMs) return '1 day';
  const hours = Math.floor(ms / HourMs);
  if (hours >= 2) return `${hours} hours`;
  return hours === 1 ? '1 hour' : 'under an hour';
}

type Stat = { label: string; value: number; note: React.ReactNode; tone?: 'danger'; dot?: boolean };

/**
 * The queue at a glance — five numbers, each with what it means — and, when a
 * ticket is past its SLA, the one furthest behind with a way straight to it.
 */
export function TicketOverview({
  summary,
  inProgress,
  viewerName,
  worst,
}: {
  summary: TicketSummary;
  inProgress: number;
  viewerName: string;
  /** The overdue ticket furthest past its due time, if any. */
  worst: TicketListItem | null;
}): React.JSX.Element {
  const clear = (text: string) => (
    <span className="inline-flex items-center gap-1.5">
      <CircleCheck className="size-3.5 text-success" />
      {text}
    </span>
  );
  const stats: Stat[] = [
    { label: 'Open', value: summary.open, note: `${formatCount(inProgress)} in progress` },
    {
      label: 'Overdue',
      value: summary.overdue,
      note: summary.overdue ? `past ${summary.overdue === 1 ? 'its' : 'their'} SLA` : clear('all within their SLA'),
      ...(summary.overdue > 0 && { tone: 'danger' as const, dot: true }),
    },
    {
      label: 'Needs a reply',
      value: summary.awaitingStaff,
      note: summary.awaitingStaff ? 'the investor wrote last' : clear('the investor wrote last'),
    },
    {
      label: 'Unassigned',
      value: summary.unassigned,
      note: summary.unassigned ? 'nobody has picked these up' : clear('every ticket has an owner'),
    },
    { label: 'Assigned to you', value: summary.mine, note: viewerName },
  ];

  const now = Date.now();

  return (
    <Card className="mb-5 p-6">
      <div className="grid grid-cols-2 gap-y-5 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat, index) => (
          <div key={stat.label} className={cn('min-w-0 px-0 xl:px-6', index > 0 && 'xl:border-l xl:border-line', index === 0 && 'xl:pl-0')}>
            <p className="flex items-center gap-2 text-[13.5px] text-ink-muted">
              {stat.dot ? <span className="size-2 rounded-full bg-danger" /> : null}
              {stat.label}
            </p>
            <p className={cn('tabular mt-2 text-[30px] leading-none font-semibold', stat.tone === 'danger' ? 'text-danger' : 'text-ink')}>
              {formatCount(stat.value)}
            </p>
            <p className="mt-2.5 truncate text-[12.5px] text-ink-muted">{stat.note}</p>
          </div>
        ))}
      </div>

      {worst ? (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-danger/25 bg-danger-soft px-4 py-3">
          <AlertTriangle className="size-5 shrink-0 text-danger" />
          <p className="min-w-0 flex-1 text-[13.5px] text-ink">
            <span className="tabular font-semibold">{worst.reference}</span> is {spanText(now - Date.parse(worst.slaDueAt))} past its SLA
            {now - Date.parse(worst.lastMessageAt) >= DayMs
              ? `, and nothing has happened on it for ${spanText(now - Date.parse(worst.lastMessageAt))}.`
              : '.'}
            {summary.overdue > 1 ? <span className="text-ink-muted"> {formatCount(summary.overdue - 1)} more overdue.</span> : null}
          </p>
          <Link
            href={`/support/${worst.id}`}
            className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-brand hover:text-brand-deep"
          >
            Reply now
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : null}
    </Card>
  );
}

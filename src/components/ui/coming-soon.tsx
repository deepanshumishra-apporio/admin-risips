import type { LucideIcon } from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';

type ComingSoonProps = {
  title: string;
  icon: LucideIcon;
  summary: string;
  planned: string[];
};

/** A section the product has planned but the platform has no data for yet. Says so plainly. */
export function ComingSoon({ title, icon: Icon, summary, planned }: ComingSoonProps): React.JSX.Element {
  return (
    <>
      <PageHeader title={title} />
      <Card>
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Icon className="size-6" strokeWidth={1.9} />
          </span>
          <span className="mb-3 rounded-full border border-brand/20 bg-brand-soft px-2.5 py-0.5 text-[12px] font-semibold text-brand-deep">
            Coming soon
          </span>
          <p className="max-w-md text-[14px] leading-relaxed text-ink-soft">{summary}</p>
          <ul className="mt-5 space-y-1.5 text-left text-[13px] text-ink-muted">
            {planned.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-ink-muted" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </>
  );
}

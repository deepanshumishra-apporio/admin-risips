import { cn } from '@/utils/cn';

export function Skeleton({ className }: { className?: string }): React.JSX.Element {
  return <div aria-hidden className={cn('animate-pulse rounded-md bg-surface-sunken', className)} />;
}

/** A page's worth of placeholders: header, a stat rail and a few cards. */
export function PageSkeleton({ cards = 3 }: { cards?: number }): React.JSX.Element {
  return (
    <div role="status" aria-label="Loading">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="mt-2 h-4 w-80" />
      <div className="mt-6 flex flex-wrap gap-x-12 gap-y-5 border-b border-line pb-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {Array.from({ length: cards }, (_, index) => (
          <Skeleton key={index} className="h-64" />
        ))}
      </div>
    </div>
  );
}

import { cn } from '@/utils/cn';

/**
 * Placeholders shown by each route's `loading.tsx` while its server component
 * fetches. Each variant mirrors one page layout — header, stat rail, table,
 * detail or form — at the real components' sizes, so content lands where the
 * placeholder was instead of the page jumping.
 */

export function Skeleton({ className }: { className?: string }): React.JSX.Element {
  return <div aria-hidden className={cn('animate-pulse rounded-md bg-surface-sunken motion-reduce:animate-none', className)} />;
}

/** Wrapper every page skeleton uses: one live region, announced once. */
function Loading({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      {children}
    </div>
  );
}

/** Mirrors `PageHeader`: title, description, optional action buttons. */
function HeaderSkeleton({ actions = 0 }: { actions?: number }): React.JSX.Element {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-80 max-w-[70vw]" />
      </div>
      {actions > 0 ? (
        <div className="flex gap-2">
          {Array.from({ length: actions }, (_, index) => (
            <Skeleton key={index} className="h-9 w-28" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Mirrors `StatStrip`. */
function StatsSkeleton({ count = 5 }: { count?: number }): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-x-12 gap-y-5 border-b border-line pb-5">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="min-w-[132px] space-y-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Mirrors `Table` inside a `Card`: header row plus body rows. */
function TableBodySkeleton({ rows, columns }: { rows: number; columns: number }): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
      <div className="flex gap-6 border-b border-line bg-surface-sunken px-4 py-3">
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={index} className="h-3 flex-1 bg-line" />
        ))}
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex items-center gap-6 px-4 py-3.5">
            {Array.from({ length: columns }, (_, column) => (
              <Skeleton key={column} className={cn('h-4 flex-1', column === 0 && 'max-w-[220px]')} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** A page's worth of placeholders: header, a stat rail and a few cards. The dashboard shape. */
export function PageSkeleton({ cards = 3 }: { cards?: number }): React.JSX.Element {
  return (
    <Loading>
      <HeaderSkeleton />
      <StatsSkeleton />
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {Array.from({ length: cards }, (_, index) => (
          <Skeleton key={index} className="h-64" />
        ))}
      </div>
    </Loading>
  );
}

type TableSkeletonProps = {
  /** Show a stat rail above the table (0 hides it). */
  stats?: number;
  /** Show the tab row some list pages put above the filters. */
  tabs?: boolean;
  rows?: number;
  columns?: number;
  actions?: number;
};

/** List pages: header, optional stats and tabs, search bar, then a table. */
export function TableSkeleton({ stats = 0, tabs = false, rows = 8, columns = 5, actions = 1 }: TableSkeletonProps): React.JSX.Element {
  return (
    <Loading>
      <HeaderSkeleton actions={actions} />
      {stats > 0 ? <StatsSkeleton count={stats} /> : null}
      {tabs ? (
        <div className="mt-5 flex gap-6 border-b border-line pb-2.5">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-20" />
          ))}
        </div>
      ) : null}
      <div className="mt-5 mb-4 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-9 w-72 max-w-[80vw]" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
      <TableBodySkeleton rows={rows} columns={columns} />
    </Loading>
  );
}

/** Detail pages: header, optional stats and section tabs, a main column and a side column. */
export function DetailSkeleton({ stats = 0, tabs = false }: { stats?: number; tabs?: boolean }): React.JSX.Element {
  return (
    <Loading>
      <Skeleton className="mb-4 h-3.5 w-40" />
      <HeaderSkeleton actions={2} />
      {stats > 0 ? <StatsSkeleton count={stats} /> : null}
      {tabs ? (
        <div className="mt-5 flex gap-6 border-b border-line pb-2.5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-24" />
          ))}
        </div>
      ) : null}
      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-72" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-56" />
        </div>
      </div>
    </Loading>
  );
}

/** Create / edit pages: header, then labelled fields in a card. */
export function FormSkeleton({ fields = 6 }: { fields?: number }): React.JSX.Element {
  return (
    <Loading>
      <Skeleton className="mb-4 h-3.5 w-40" />
      <HeaderSkeleton />
      <div className="max-w-3xl rounded-[var(--radius-card)] border border-line bg-surface p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: fields }, (_, index) => (
            <div key={index} className="space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-5 h-24 w-full" />
        <div className="mt-6 flex justify-end gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    </Loading>
  );
}

/** Index pages laid out as a grid of cards (e.g. the report catalogue). */
export function CardGridSkeleton({ cards = 6 }: { cards?: number }): React.JSX.Element {
  return (
    <Loading>
      <HeaderSkeleton />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }, (_, index) => (
          <Skeleton key={index} className="h-36" />
        ))}
      </div>
    </Loading>
  );
}

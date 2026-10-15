import { TableSkeleton } from '@/components/ui/skeleton';

/** Support queue: stats and tickets. */
export default function Loading(): React.JSX.Element {
  return <TableSkeleton stats={4} columns={6} />;
}

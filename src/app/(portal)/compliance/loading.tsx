import { TableSkeleton } from '@/components/ui/skeleton';

/** Compliance alerts: stats and alert table. */
export default function Loading(): React.JSX.Element {
  return <TableSkeleton stats={4} columns={6} />;
}

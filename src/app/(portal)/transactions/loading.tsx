import { TableSkeleton } from '@/components/ui/skeleton';

/** Transactions: summary stats and the order table. */
export default function Loading(): React.JSX.Element {
  return <TableSkeleton stats={4} columns={7} />;
}

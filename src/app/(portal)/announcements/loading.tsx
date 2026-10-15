import { TableSkeleton } from '@/components/ui/skeleton';

/** Announcements: stats, status tabs, table. */
export default function Loading(): React.JSX.Element {
  return <TableSkeleton stats={4} tabs columns={6} />;
}

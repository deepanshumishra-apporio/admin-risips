import { TableSkeleton } from '@/components/ui/skeleton';

/** Investor list: search and table. */
export default function Loading(): React.JSX.Element {
  return <TableSkeleton columns={6} />;
}

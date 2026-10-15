import { TableSkeleton } from '@/components/ui/skeleton';

/** One report: filters and result table. */
export default function Loading(): React.JSX.Element {
  return <TableSkeleton columns={7} />;
}

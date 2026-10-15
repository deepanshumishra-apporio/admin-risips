import { TableSkeleton } from '@/components/ui/skeleton';

/** Roles list. */
export default function Loading(): React.JSX.Element {
  return <TableSkeleton tabs columns={4} />;
}

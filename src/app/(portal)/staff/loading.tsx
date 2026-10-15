import { TableSkeleton } from '@/components/ui/skeleton';

/** Staff list. */
export default function Loading(): React.JSX.Element {
  return <TableSkeleton tabs columns={5} />;
}

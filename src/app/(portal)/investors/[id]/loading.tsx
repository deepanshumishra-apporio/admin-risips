import { DetailSkeleton } from '@/components/ui/skeleton';

/** Investor detail: stats, section tabs, panels. */
export default function Loading(): React.JSX.Element {
  return <DetailSkeleton stats={5} tabs />;
}

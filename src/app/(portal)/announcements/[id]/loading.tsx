import { DetailSkeleton } from '@/components/ui/skeleton';

/** One announcement: reach stats and content. */
export default function Loading(): React.JSX.Element {
  return <DetailSkeleton stats={4} />;
}

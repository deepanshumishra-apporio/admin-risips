import { PageSkeleton } from '@/components/ui/skeleton';

/** Fallback for any portal page without its own skeleton. */
export default function Loading(): React.JSX.Element {
  return <PageSkeleton />;
}

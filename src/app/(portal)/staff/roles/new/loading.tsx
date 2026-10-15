import { FormSkeleton } from '@/components/ui/skeleton';

/** New role. */
export default function Loading(): React.JSX.Element {
  return <FormSkeleton fields={4} />;
}

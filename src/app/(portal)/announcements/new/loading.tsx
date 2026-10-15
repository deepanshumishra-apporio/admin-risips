import { FormSkeleton } from '@/components/ui/skeleton';

/** New announcement form. */
export default function Loading(): React.JSX.Element {
  return <FormSkeleton fields={6} />;
}

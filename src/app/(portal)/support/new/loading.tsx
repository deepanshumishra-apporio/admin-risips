import { FormSkeleton } from '@/components/ui/skeleton';

/** New ticket form. */
export default function Loading(): React.JSX.Element {
  return <FormSkeleton fields={4} />;
}

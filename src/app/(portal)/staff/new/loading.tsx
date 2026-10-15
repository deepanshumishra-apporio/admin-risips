import { FormSkeleton } from '@/components/ui/skeleton';

/** Add staff form. */
export default function Loading(): React.JSX.Element {
  return <FormSkeleton fields={4} />;
}

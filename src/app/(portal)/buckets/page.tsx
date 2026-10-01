import { Boxes } from 'lucide-react';
import type { Metadata } from 'next';

import { ComingSoon } from '@/components/ui/coming-soon';

export const metadata: Metadata = { title: 'Buckets · RiSips Admin' };

export default function BucketsPage(): React.JSX.Element {
  return (
    <ComingSoon
      title="Buckets"
      icon={Boxes}
      summary="Rule-based investor segments, each with the funds its members get suggested. Buckets aren't set up on the platform yet."
      planned={[
        'Segments built from rules on profile and behaviour',
        'The investors who fall into each bucket, kept up to date',
        'The funds recommended to each segment',
      ]}
    />
  );
}

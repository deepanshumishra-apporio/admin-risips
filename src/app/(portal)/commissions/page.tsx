import { IndianRupee } from 'lucide-react';
import type { Metadata } from 'next';

import { ComingSoon } from '@/components/ui/coming-soon';

export const metadata: Metadata = { title: 'Commissions · RiSips Admin' };

export default function CommissionsPage(): React.JSX.Element {
  return (
    <ComingSoon
      title="Commissions"
      icon={IndianRupee}
      summary="Trail and upfront commission from the fund houses, and payouts to agents. The admin has no commission data yet."
      planned={['Commission received from each fund house, by month', 'Payouts due to agents', 'A reconciliation against the RTA brokerage statements']}
    />
  );
}

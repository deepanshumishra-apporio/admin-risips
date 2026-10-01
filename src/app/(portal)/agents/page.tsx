import { UsersRound } from 'lucide-react';
import type { Metadata } from 'next';

import { ComingSoon } from '@/components/ui/coming-soon';

export const metadata: Metadata = { title: 'Agents · RiSips Admin' };

export default function AgentsPage(): React.JSX.Element {
  return (
    <ComingSoon
      title="Agents"
      icon={UsersRound}
      summary="Sub-brokers and ARN holders who bring in and service investors. There are no agents on the platform yet, so there is nothing to show."
      planned={[
        'A directory of agents with their ARN, EUIN and licence expiry',
        'The investors and assets each agent services',
        'Alerts for licences about to lapse',
      ]}
    />
  );
}

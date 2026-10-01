import { Lock } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

/** A page the staff member's roles do not cover. Says so rather than failing. */
export function NoAccess({ what }: { what: string }): React.JSX.Element {
  return (
    <Card>
      <EmptyState
        icon={<Lock className="size-5" />}
        title="You don't have access to this"
        description={`Your role doesn't include ${what}. Ask a super admin if you need it.`}
      />
    </Card>
  );
}

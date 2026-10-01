import { Lock } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import type { AdminProfile } from '@/types/profile.types';

type RoleCardProps = {
  profile: AdminProfile;
};

/**
 * Read-only on purpose. A role is what decides which sections you can open, so
 * letting anyone edit their own here would be a privilege escalation — the
 * change has to come from another super admin in Sub-admins.
 */
export function RoleCard({ profile }: RoleCardProps): React.JSX.Element {
  return (
    <Card>
      <CardHeader
        title="Role and access"
        subtitle="Assigned by a super admin"
        action={
          <span className="flex items-center gap-1.5 rounded-md border border-line-strong bg-surface-sunken px-2 py-1 text-[11.5px] font-medium text-ink-muted">
            <Lock className="size-3" />
            Locked
          </span>
        }
      />
      <CardBody className="space-y-4">
        <div>
          <p className="text-[11.5px] text-ink-muted">Role</p>
          <p className="mt-1 flex items-center gap-2">
            <Badge tone="brand">{profile.role}</Badge>
            {profile.role === 'Super Admin' ? (
              <span className="text-[12px] text-ink-muted">Full access to every section</span>
            ) : null}
          </p>
        </div>

        <div>
          <p className="text-[11.5px] text-ink-muted">Sections you can open</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {profile.permissions.map((permission) => (
              <Badge key={permission} tone="neutral">
                {permission}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-md border border-line bg-surface-sunken px-3 py-2.5">
          <Lock className="mt-0.5 size-3.5 shrink-0 text-ink-muted" />
          <p className="text-[12.5px] leading-relaxed text-ink-soft">
            You cannot change your own role or permissions. Another super admin does it from{' '}
            <Link href="/staff" className="font-medium text-brand hover:text-brand-deep">
              Sub-admins
            </Link>
            , and the change is written to the audit log.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

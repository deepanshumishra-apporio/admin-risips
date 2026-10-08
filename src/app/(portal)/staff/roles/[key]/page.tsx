import { ArrowLeft, Lock } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { DeleteRole } from '@/features/roles/components/delete-role';
import { RoleForm } from '@/features/roles/components/role-form';
import { LevelRoles } from '@/features/staff/hierarchy';
import { StaffStatusLabel } from '@/features/staff/labels';
import { listPermissions, listRoles, listStaff } from '@/lib/api/staff-admin';
import { currentStaff } from '@/lib/auth/session';
import type { StaffListItem } from '@/types/admin-api.types';

export const metadata: Metadata = { title: 'Role · RiSips Admin' };

type RolePageProps = { params: Promise<{ key: string }> };

function Holders({ staff }: { staff: StaffListItem[] }): React.JSX.Element {
  if (staff.length === 0) return <p className="text-[13px] text-ink-muted">Nobody has this role.</p>;
  return (
    <ul className="space-y-2.5">
      {staff.map((member) => (
        <li key={member.id}>
          <Link href={`/staff/${member.id}`} className="flex items-center gap-2.5 rounded-md hover:opacity-80">
            <Avatar name={member.fullName} className="size-8 text-[11.5px]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink">{member.fullName}</span>
              <span className="block truncate text-[12px] text-ink-muted">{member.email}</span>
            </span>
            {member.status !== 'ACTIVE' ? <Badge tone="neutral">{StaffStatusLabel[member.status]}</Badge> : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function RolePage({ params }: RolePageProps): Promise<React.JSX.Element> {
  const me = await currentStaff();
  if (!me.permissions.includes('roles.manage')) {
    return (
      <>
        <PageHeader title="Role" />
        <NoAccess what="the Role Manager" />
      </>
    );
  }

  const { key } = await params;
  const canSeeStaff = me.permissions.includes('staff.manage');
  const [roles, catalogue, staff] = await Promise.all([
    listRoles(),
    listPermissions(),
    canSeeStaff ? listStaff() : Promise.resolve(null),
  ]);
  const role = roles.find((entry) => entry.key === key);
  if (!role) notFound();

  const holdsIt = me.roles.some((entry) => entry.key === role.key);
  // Custom roles you don't hold can be deleted; the rest stay.
  const editable = !LevelRoles.includes(role.key) && !holdsIt;
  // Deactivated accounts keep their roles, so they block a delete too.
  const holders = staff?.filter((member) => member.roles.some((entry) => entry.key === role.key)) ?? null;
  const deletable = role.staffCount === 0 && (holders === null || holders.length === 0);

  return (
    <>
      <Link href="/staff/roles" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-3.5" />
        Roles
      </Link>
      <PageHeader
        title={role.name}
        {...(role.description && { description: role.description })}
        actions={
          role.isSystem ? (
            <Badge tone="neutral" className="gap-1">
              <Lock className="size-3" /> Built-in
            </Badge>
          ) : (
            <Badge tone="brand">Custom</Badge>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card>
          <CardBody>
            <RoleForm
              role={role}
              catalogue={catalogue}
              mine={me.permissions}
              {...(holdsIt && { readOnlyReason: 'You hold this role, so another admin has to change it.' })}
            />
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="People" action={<span className="tabular text-[13px] font-semibold text-ink">{holders?.length ?? role.staffCount}</span>} />
            <CardBody>
              {holders ? <Holders staff={holders} /> : <p className="text-[13px] text-ink-muted">{role.staffCount} active staff.</p>}
            </CardBody>
          </Card>

          {editable && !role.isSystem ? (
            <Card>
              <CardBody>
                {deletable ? (
                  <DeleteRole roleKey={role.key} name={role.name} />
                ) : (
                  <p className="text-[12.5px] text-ink-muted">To delete this role, give its staff another role first.</p>
                )}
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

import { UserPlus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { StaffTable } from '@/features/staff/components/staff-table';
import { StaffTabs } from '@/features/staff/components/staff-tabs';
import { listStaff } from '@/lib/api/staff-admin';
import { currentStaff } from '@/lib/auth/session';
import { formatCount } from '@/utils/format';

export const metadata: Metadata = { title: 'Staff · RiSips Admin' };

export default async function StaffPage(): Promise<React.JSX.Element> {
  const me = await currentStaff();
  if (!me.permissions.includes('staff.manage')) {
    // Role Manager lives in this section too; someone who can only manage roles lands there.
    if (me.permissions.includes('roles.manage')) redirect('/staff/roles');
    return (
      <>
        <PageHeader title="Staff" />
        <NoAccess what="staff management" />
      </>
    );
  }

  const staff = await listStaff();
  const active = staff.filter((member) => member.status === 'ACTIVE').length;

  return (
    <>
      <PageHeader
        title="Staff"
        description="Everyone who can sign in to this portal."
        actions={
          <Link
            href="/staff/new"
            className="inline-flex h-9.5 items-center gap-2 rounded-md bg-brand px-4 text-[13.5px] font-medium text-white hover:bg-brand-deep"
          >
            <UserPlus className="size-4" />
            Add staff member
          </Link>
        }
      />
      <StaffTabs permissions={me.permissions} />
      <Card>
        <div className="border-b border-line px-4 py-2.5 text-[12.5px] text-ink-muted">
          <span className="tabular font-semibold text-ink">{formatCount(active)}</span> active of {formatCount(staff.length)}
        </div>
        <StaffTable staff={staff} currentStaffId={me.id} />
      </Card>
    </>
  );
}

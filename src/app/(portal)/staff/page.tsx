import { UserPlus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { StaffTable } from '@/features/staff/components/staff-table';
import { listStaff } from '@/lib/api/staff-admin';
import { currentStaff, hasPermission } from '@/lib/auth/session';
import { formatCount } from '@/utils/format';

export const metadata: Metadata = { title: 'Staff · RiSips Admin' };

export default async function StaffPage(): Promise<React.JSX.Element> {
  if (!(await hasPermission('staff.manage'))) {
    return (
      <>
        <PageHeader title="Staff" />
        <NoAccess what="staff management" />
      </>
    );
  }

  const [staff, me] = await Promise.all([listStaff(), currentStaff()]);
  const active = staff.filter((member) => member.status === 'ACTIVE').length;

  return (
    <>
      <PageHeader
        title="Staff"
        description="Everyone who can sign in to this portal, what their roles let them do, and how their account is secured."
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
      <Card>
        <div className="border-b border-line px-4 py-2.5 text-[12.5px] text-ink-muted">
          <span className="tabular font-semibold text-ink">{formatCount(active)}</span> active of {formatCount(staff.length)}
        </div>
        <StaffTable staff={staff} currentStaffId={me.id} />
      </Card>
    </>
  );
}

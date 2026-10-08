import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { CreateStaffForm } from '@/features/staff/components/create-staff-form';
import { listRoles } from '@/lib/api/staff-admin';
import { currentStaff, hasPermission } from '@/lib/auth/session';
import { myLevel } from '@/features/staff/hierarchy';

export const metadata: Metadata = { title: 'Add staff member · RiSips Admin' };

export default async function NewStaffPage(): Promise<React.JSX.Element> {
  if (!(await hasPermission('staff.manage'))) {
    return (
      <>
        <PageHeader title="Add staff member" />
        <NoAccess what="staff management" />
      </>
    );
  }
  const [roles, me] = await Promise.all([listRoles(), currentStaff()]);

  return (
    <>
      <Link href="/staff" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-3.5" />
        Staff
      </Link>
      <PageHeader
        title="Add staff member"
        description="They get a temporary password to share privately, then set their own password and two-factor sign-in the first time they sign in."
      />
      <Card className="max-w-2xl">
        <CardBody>
          <CreateStaffForm roles={roles} actorLevel={myLevel(me)} />
        </CardBody>
      </Card>
    </>
  );
}

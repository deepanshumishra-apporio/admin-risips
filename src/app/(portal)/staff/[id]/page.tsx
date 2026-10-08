import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { NoAccess } from '@/components/ui/no-access';
import { StaffMemberView } from '@/features/staff/components/staff-member-view';
import { ApiError } from '@/lib/api/errors';
import { getStaff, listRoles } from '@/lib/api/staff-admin';
import { currentStaff, hasPermission } from '@/lib/auth/session';
import type { StaffDetail } from '@/types/admin-api.types';

export const metadata: Metadata = { title: 'Staff member · RiSips Admin' };

type StaffMemberPageProps = { params: Promise<{ id: string }> };

export default async function StaffMemberPage({ params }: StaffMemberPageProps): Promise<React.JSX.Element> {
  if (!(await hasPermission('staff.manage'))) {
    return (
      <>
        <PageHeader title="Staff member" />
        <NoAccess what="staff management" />
      </>
    );
  }

  const { id } = await params;
  let staff: StaffDetail;
  try {
    staff = await getStaff(id);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }
  const [roles, me] = await Promise.all([listRoles(), currentStaff()]);

  return (
    <>
      <Link href="/staff" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-3.5" />
        Staff
      </Link>
      <StaffMemberView staff={staff} roles={roles} me={me} />
    </>
  );
}

import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { RoleForm } from '@/features/roles/components/role-form';
import { listPermissions } from '@/lib/api/staff-admin';
import { currentStaff } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Create role · RiSips Admin' };

export default async function NewRolePage(): Promise<React.JSX.Element> {
  const me = await currentStaff();
  if (!me.permissions.includes('roles.manage')) {
    return (
      <>
        <PageHeader title="Create role" />
        <NoAccess what="the Role Manager" />
      </>
    );
  }
  const catalogue = await listPermissions();

  return (
    <>
      <Link href="/staff/roles" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-3.5" />
        Roles
      </Link>
      <PageHeader title="Create role" description="Staff with this role see only the sections you tick." />
      <Card className="max-w-4xl">
        <CardBody>
          <RoleForm catalogue={catalogue} mine={me.permissions} />
        </CardBody>
      </Card>
    </>
  );
}

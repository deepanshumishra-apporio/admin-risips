import { ArrowLeft, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { Table, Td } from '@/components/ui/table';
import { EditStaffForm } from '@/features/staff/components/edit-staff-form';
import { StaffCommands } from '@/features/staff/components/staff-commands';
import { LoginOutcomeLabel, StaffStatusLabel, StaffStatusTone } from '@/features/staff/labels';
import { ApiError } from '@/lib/api/errors';
import { getStaff, listRoles } from '@/lib/api/staff-admin';
import { currentStaff, hasPermission } from '@/lib/auth/session';
import type { StaffDetail } from '@/types/admin-api.types';
import { formatDate, formatDateTime } from '@/utils/format';

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
  const isSelf = me.id === staff.id;

  return (
    <>
      <Link href="/staff" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-3.5" />
        Staff
      </Link>

      <PageHeader
        title={staff.fullName}
        description={`${staff.email} · Added ${formatDate(staff.createdAt)}${staff.createdBy ? ` by ${staff.createdBy.fullName}` : ''}`}
        actions={
          <>
            <Badge tone={StaffStatusTone[staff.status]} dot>
              {StaffStatusLabel[staff.status]}
            </Badge>
            {staff.mfaEnrolled ? (
              <Badge tone="success">
                <ShieldCheck className="size-3.5" /> Two-factor on
              </Badge>
            ) : (
              <Badge tone="warn">
                <ShieldAlert className="size-3.5" /> Two-factor not set up
              </Badge>
            )}
            {staff.locked ? <Badge tone="danger">Locked out</Badge> : null}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader title="Details and roles" subtitle="Role changes apply on their next click; no sign-out needed." />
            <CardBody>
              <EditStaffForm staff={staff} roles={roles} isSelf={isSelf} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Recent sign-in activity" subtitle="The last 15 attempts, successful or not" />
            {staff.recentLogins.length === 0 ? (
              <CardBody>
                <p className="text-[13px] text-ink-muted">No sign-in attempts yet.</p>
              </CardBody>
            ) : (
              <Table headers={['When', 'Outcome', 'IP address']}>
                {staff.recentLogins.map((login) => (
                  <tr key={`${login.at}-${login.outcome}`}>
                    <Td className="text-[13px]">{formatDateTime(login.at)}</Td>
                    <Td>
                      <Badge tone={login.outcome.endsWith('SUCCESS') ? 'success' : 'danger'}>
                        {LoginOutcomeLabel[login.outcome] ?? login.outcome}
                      </Badge>
                    </Td>
                    <Td className="tabular text-[13px]">{login.ipAddress ?? '—'}</Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </div>

        <Card>
          <CardHeader title="Account security" {...(isSelf && { subtitle: 'This is your own account' })} />
          <CardBody>
            {isSelf ? (
              <p className="text-[13px] leading-relaxed text-ink-muted">
                You can&apos;t suspend or reset your own account here. Use{' '}
                <Link href="/signin/password" className="font-medium text-brand hover:text-brand-deep">
                  Change password
                </Link>{' '}
                for your password; for anything else, ask another admin.
              </p>
            ) : (
              <StaffCommands staff={staff} />
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

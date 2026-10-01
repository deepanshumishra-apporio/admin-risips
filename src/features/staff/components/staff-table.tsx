import { ShieldAlert, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, Td } from '@/components/ui/table';
import { StaffStatusLabel, StaffStatusTone } from '@/features/staff/labels';
import type { StaffListItem } from '@/types/admin-api.types';
import { timeAgo } from '@/utils/format';

const Headers = ['Staff member', 'Roles', 'Status', 'Two-factor', 'Last sign-in'] as const;

export function StaffTable({ staff, currentStaffId }: { staff: StaffListItem[]; currentStaffId: string }): React.JSX.Element {
  return (
    <Table headers={Headers}>
      {staff.map((member) => (
        <tr key={member.id} className="group transition-colors hover:bg-surface-sunken">
          <Td>
            <Link href={`/staff/${member.id}`} className="flex items-center gap-2.5">
              <Avatar name={member.fullName} />
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-semibold text-ink group-hover:text-brand">
                  {member.fullName}
                  {member.id === currentStaffId ? <span className="ml-1.5 font-normal text-ink-muted">(you)</span> : null}
                </span>
                <span className="block truncate text-[12px] text-ink-muted">{member.email}</span>
              </span>
            </Link>
          </Td>
          <Td>
            <span className="flex flex-wrap gap-1">
              {member.roles.map((role) => (
                <Badge key={role.key} tone="brand">
                  {role.name}
                </Badge>
              ))}
            </span>
          </Td>
          <Td>
            <Badge tone={StaffStatusTone[member.status]} dot>
              {StaffStatusLabel[member.status]}
            </Badge>
            {member.locked ? <span className="mt-1 block text-[11.5px] text-danger">Locked out</span> : null}
            {member.mustChangePassword && member.status === 'ACTIVE' ? (
              <span className="mt-1 block text-[11.5px] text-ink-muted">Temporary password</span>
            ) : null}
          </Td>
          <Td>
            {member.mfaEnrolled ? (
              <span className="flex items-center gap-1.5 text-[13px] text-success">
                <ShieldCheck className="size-4" /> Set up
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[13px] text-warn">
                <ShieldAlert className="size-4" /> Not yet
              </span>
            )}
          </Td>
          <Td className="text-[13px] text-ink-muted">{member.lastLoginAt ? timeAgo(member.lastLoginAt) : 'Never'}</Td>
        </tr>
      ))}
    </Table>
  );
}

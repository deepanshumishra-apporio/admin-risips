import { ChevronRight, Lock, Plus, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { PermissionGroups, PermissionLabel } from '@/features/staff/labels';
import { StaffTabs } from '@/features/staff/components/staff-tabs';
import { AdminRole, RoleManagerRole, SubAdminRole } from '@/features/staff/hierarchy';
import { listPermissions, listRoles } from '@/lib/api/staff-admin';
import { currentStaff } from '@/lib/auth/session';
import type { Permission, PermissionInfo, Role } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatCount } from '@/utils/format';

export const metadata: Metadata = { title: 'Roles · RiSips Admin' };

/** One dot per permission, in menu order: what a role opens, at a glance. */
function AccessDots({ role, catalogue }: { role: Role; catalogue: PermissionInfo[] }): React.JSX.Element {
  const known = new Set(catalogue.map((entry) => entry.key));
  const ordered: Permission[] = PermissionGroups.flatMap((group) => group.permissions).filter((key) => known.has(key));
  return (
    <span className="flex items-center gap-2">
      <span className="flex gap-[3px]" aria-hidden>
        {ordered.map((key) => (
          <span
            key={key}
            title={PermissionLabel[key]}
            className={cn('h-3 w-1.5 rounded-full', role.permissions.includes(key) ? 'bg-brand' : 'bg-line-strong/60')}
          />
        ))}
      </span>
      <span className="tabular text-[12px] text-ink-muted">
        {role.permissions.length}/{ordered.length}
      </span>
    </span>
  );
}

export default async function RolesPage(): Promise<React.JSX.Element> {
  const me = await currentStaff();
  if (!me.permissions.includes('roles.manage')) {
    return (
      <>
        <PageHeader title="Role Manager" />
        <NoAccess what="the Role Manager" />
      </>
    );
  }

  const [allRoles, catalogue] = await Promise.all([listRoles(), listPermissions()]);
  // Role Manager access is a switch on a sub-admin, not a role anyone picks.
  const roles = allRoles.filter((role) => role.key !== RoleManagerRole);
  const mine = new Set(me.roles.map((role) => role.key));

  return (
    <>
      <PageHeader
        title="Role Manager"
        description="Operator roles decide which sections each operator can see."
        actions={
          <Link
            href="/staff/roles/new"
            className="inline-flex h-9.5 items-center gap-2 rounded-md bg-brand px-4 text-[13.5px] font-medium text-white hover:bg-brand-deep"
          >
            <Plus className="size-4" />
            Create role
          </Link>
        }
      />
      <StaffTabs permissions={me.permissions} />

      <Card>
        <ul className="divide-y divide-line">
          {roles.map((role) => (
            <li key={role.key}>
              <Link
                href={`/staff/roles/${role.key}`}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 transition-colors hover:bg-surface-sunken sm:grid-cols-[minmax(0,1fr)_170px_90px_16px]"
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold text-ink">{role.name}</span>
                    {role.key === AdminRole || role.key === SubAdminRole ? (
                      <Badge tone="violet">Level</Badge>
                    ) : role.isSystem ? (
                      <Badge tone="neutral" className="gap-1">
                        <Lock className="size-3" /> Built-in
                      </Badge>
                    ) : (
                      <Badge tone="brand">Custom</Badge>
                    )}
                    {mine.has(role.key) ? <Badge tone="success">Yours</Badge> : null}
                  </span>
                  {role.description ? <span className="mt-0.5 block truncate text-[12.5px] text-ink-muted">{role.description}</span> : null}
                </span>
                <span className="col-start-1 sm:col-start-auto">
                  <AccessDots role={role} catalogue={catalogue} />
                </span>
                <span className="tabular row-start-1 flex items-center gap-1.5 justify-self-end text-[13px] text-ink-soft sm:row-start-auto sm:justify-self-start">
                  <Users className="size-3.5 text-ink-muted" />
                  {formatCount(role.staffCount)}
                </span>
                <ChevronRight className="hidden size-4 text-ink-muted sm:block" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

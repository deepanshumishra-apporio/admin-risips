import { PageTabs } from '@/components/ui/page-tabs';
import type { Permission } from '@/types/admin-api.types';

/** Staff and Role Manager share the Staff section; each tab shows only to those who can open it. */
export function StaffTabs({ permissions }: { permissions: Permission[] }): React.JSX.Element | null {
  const tabs = [
    ...(permissions.includes('staff.manage') ? [{ label: 'Staff', href: '/staff' }] : []),
    ...(permissions.includes('roles.manage') ? [{ label: 'Roles', href: '/staff/roles' }] : []),
  ];
  return tabs.length > 1 ? <PageTabs tabs={tabs} /> : null;
}

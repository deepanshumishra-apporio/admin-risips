import type { Permission } from '@/types/admin-api.types';

/** Landing pages in order of preference; the first the staff member may open wins. */
const Landing: { permission: Permission; href: string }[] = [
  { permission: 'dashboard.read', href: '/dashboard' },
  { permission: 'investors.read', href: '/investors' },
  { permission: 'transactions.read', href: '/transactions' },
  { permission: 'compliance.manage', href: '/compliance' },
  { permission: 'support.manage', href: '/support' },
  { permission: 'reports.read', href: '/reports' },
  { permission: 'announcements.manage', href: '/announcements' },
  { permission: 'portfolios.manage', href: '/model-portfolios' },
  { permission: 'meetings.manage', href: '/review-meetings' },
  { permission: 'staff.manage', href: '/staff' },
  { permission: 'roles.manage', href: '/staff/roles' },
];

/** Where a staff member's portal starts. Everyone may open their own profile. */
export function landingFor(permissions: readonly Permission[]): string {
  return Landing.find((page) => permissions.includes(page.permission))?.href ?? '/profile';
}

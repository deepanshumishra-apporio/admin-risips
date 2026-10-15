import type { BadgeTone } from '@/components/ui/badge';
import type { Permission, StaffStatus } from '@/types/admin-api.types';

export const PermissionLabel: Record<Permission, string> = {
  'dashboard.read': 'Dashboard',
  'investors.read': 'Investor records',
  'reports.read': 'Reports and exports',
  'transactions.read': 'Transaction monitoring',
  'support.manage': 'Support tickets and live chat',
  'compliance.manage': 'Compliance alerts',
  'announcements.manage': 'Announcements',
  'portfolios.manage': 'Model portfolios',
  'meetings.manage': 'Review meetings',
  'staff.manage': 'Manage staff',
  'roles.manage': 'Role Manager',
};

/** How the role editor groups permissions, mirroring the portal's menu. */
export const PermissionGroups: { title: string; permissions: Permission[] }[] = [
  { title: 'Observe', permissions: ['dashboard.read', 'transactions.read', 'compliance.manage', 'reports.read'] },
  { title: 'Investors', permissions: ['investors.read'] },
  // `meetings.manage` is left out while review meetings are parked for a later release.
  { title: 'Advisory', permissions: ['portfolios.manage'] },
  { title: 'Engagement & support', permissions: ['announcements.manage', 'support.manage'] },
  { title: 'Administration', permissions: ['staff.manage', 'roles.manage'] },
];

export const StaffStatusLabel: Record<StaffStatus, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  DEACTIVATED: 'Deactivated',
};

export const StaffStatusTone: Record<StaffStatus, BadgeTone> = {
  ACTIVE: 'success',
  SUSPENDED: 'warn',
  DEACTIVATED: 'neutral',
};

export const LoginOutcomeLabel: Record<string, string> = {
  SUCCESS: 'Password accepted',
  BAD_PASSWORD: 'Wrong password',
  UNKNOWN_EMAIL: 'Unknown email',
  INACTIVE: 'Account not active',
  LOCKED: 'Locked out',
  MFA_SUCCESS: 'Signed in (2FA passed)',
  MFA_FAILED: 'Wrong 2FA code',
};

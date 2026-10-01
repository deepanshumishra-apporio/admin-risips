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
  'staff.manage': 'Manage staff',
};

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

import type { SubAdminPermission, SubAdminRole } from '@/types/agent.types';
import type { AdminNotificationKind } from '@/types/notification.types';

/** The super admin sits above the delegated roles and is not one of them. */
export type AdminRole = SubAdminRole | 'Super Admin';

export type AdminProfile = {
  name: string;
  email: string;
  phone: string;
  /** Assigned by a super admin in Sub-admins — never editable from here. */
  role: AdminRole;
  permissions: SubAdminPermission[];
  memberSince: string;
  lastActiveAt: string;
  timezone: string;
};

/** Which channels an event type reaches this admin on. */
export type ChannelPreference = {
  kind: AdminNotificationKind;
  description: string;
  inApp: boolean;
  email: boolean;
};

export type WorkspacePreferences = {
  landingPage: string;
  sidebarCollapsed: boolean;
  dateFormat: string;
  density: 'Comfortable' | 'Compact';
  digest: 'Off' | 'Daily' | 'Weekly';
  quietHoursFrom: string;
  quietHoursTo: string;
};

export type SessionRecord = {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  current: boolean;
};

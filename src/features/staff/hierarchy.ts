// Mirrors backend/src/utils/staff-hierarchy.ts — the API enforces it; this only
// shapes the screens so nobody is offered a choice the API would refuse.
//
//   Admin      SUPER_ADMIN — everything, Role Manager included
//   Sub-admin  SUB_ADMIN   — everything but Role Manager, unless an admin also
//                            gives them ROLE_MANAGER
//   Operator   any other role
//
// Admins create and manage anyone; sub-admins create and manage operators only.

import type { Permission, StaffMe } from '@/types/admin-api.types';

export type StaffLevel = 'ADMIN' | 'SUB_ADMIN' | 'OPERATOR';

export const AdminRole = 'SUPER_ADMIN';
export const SubAdminRole = 'SUB_ADMIN';
export const RoleManagerRole = 'ROLE_MANAGER';

/** Roles that set a level rather than grant operator access. */
export const LevelRoles: readonly string[] = [AdminRole, SubAdminRole, RoleManagerRole];

/** Permissions that come with a level and never go into an operator role. */
export const LevelPermissions: readonly Permission[] = ['staff.manage', 'roles.manage'];

export const LevelLabel: Record<StaffLevel, string> = { ADMIN: 'Admin', SUB_ADMIN: 'Sub-admin', OPERATOR: 'Operator' };

export function levelOf(roleKeys: readonly string[]): StaffLevel {
  if (roleKeys.includes(AdminRole)) return 'ADMIN';
  if (roleKeys.includes(SubAdminRole)) return 'SUB_ADMIN';
  return 'OPERATOR';
}

export const myLevel = (me: Pick<StaffMe, 'roles'>): StaffLevel => levelOf(me.roles.map((role) => role.key));

export function canManage(actor: StaffLevel, target: StaffLevel): boolean {
  if (actor === 'ADMIN') return true;
  if (actor === 'SUB_ADMIN') return target === 'OPERATOR';
  return false;
}

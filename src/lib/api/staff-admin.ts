import 'server-only';

import { authedRequest } from '@/lib/auth/session';
import type { PermissionInfo, Role, StaffDetail, StaffListItem } from '@/types/admin-api.types';

export function listRoles(): Promise<Role[]> {
  return authedRequest('/roles');
}

export function listPermissions(): Promise<PermissionInfo[]> {
  return authedRequest('/permissions');
}

export function listStaff(): Promise<StaffListItem[]> {
  return authedRequest('/staff');
}

export function getStaff(staffId: string): Promise<StaffDetail> {
  return authedRequest(`/staff/${encodeURIComponent(staffId)}`);
}

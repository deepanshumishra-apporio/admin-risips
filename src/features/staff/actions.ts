'use server';

import { revalidatePath } from 'next/cache';

import { ApiError } from '@/lib/api/errors';
import { authedRequest } from '@/lib/auth/session';
import type { StaffDetail, TemporaryPassword } from '@/types/admin-api.types';

export type StaffFormState = {
  error: string | null;
  /** Set once, right after an account is created or its password is reset. */
  temporaryPassword?: string;
  staffId?: string;
  email?: string;
  saved?: boolean;
};

const text = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
};

const roleKeys = (form: FormData): string[] =>
  form.getAll('roleKeys').filter((value): value is string => typeof value === 'string');

/**
 * API errors become a message on the form. Anything else is rethrown — that
 * includes the redirects `authedRequest` raises for an expired session, which
 * must reach Next rather than be swallowed here.
 */
function failure(error: unknown): StaffFormState {
  if (error instanceof ApiError) return { error: error.message };
  throw error;
}

export async function createStaff(_previous: StaffFormState, form: FormData): Promise<StaffFormState> {
  const email = text(form, 'email').toLowerCase();
  const fullName = text(form, 'fullName');
  const phone = text(form, 'phone');
  const roles = roleKeys(form);
  if (!email || !fullName) return { error: 'Enter their name and work email.' };
  if (roles.length === 0) return { error: 'Choose at least one role.' };

  try {
    const result = await authedRequest<TemporaryPassword>('/staff', {
      method: 'POST',
      body: { email, fullName, roleKeys: roles, ...(phone && { phone }) },
    });
    revalidatePath('/staff');
    return { error: null, temporaryPassword: result.temporaryPassword, staffId: result.staff.id, email: result.staff.email };
  } catch (error) {
    return failure(error);
  }
}

export async function updateStaff(_previous: StaffFormState, form: FormData): Promise<StaffFormState> {
  const staffId = text(form, 'staffId');
  const fullName = text(form, 'fullName');
  if (!fullName) return { error: 'Name cannot be empty.' };
  const includeRoles = form.get('includeRoles') === 'true';
  const roles = roleKeys(form);
  if (includeRoles && roles.length === 0) return { error: 'Choose at least one role.' };

  try {
    await authedRequest<StaffDetail>(`/staff/${encodeURIComponent(staffId)}`, {
      method: 'PATCH',
      body: { fullName, phone: text(form, 'phone') || null, ...(includeRoles && { roleKeys: roles }) },
    });
    revalidatePath('/staff');
    revalidatePath(`/staff/${staffId}`);
    return { error: null, saved: true };
  } catch (error) {
    return failure(error);
  }
}

const Commands = {
  suspend: { path: 'status', body: { status: 'SUSPENDED' } },
  reactivate: { path: 'status', body: { status: 'ACTIVE' } },
  deactivate: { path: 'status', body: { status: 'DEACTIVATED' } },
  'reset-mfa': { path: 'reset-mfa', body: undefined },
  'revoke-sessions': { path: 'revoke-sessions', body: undefined },
  'reset-password': { path: 'reset-password', body: undefined },
} as const;

export type StaffCommand = keyof typeof Commands;

export async function runStaffCommand(_previous: StaffFormState, form: FormData): Promise<StaffFormState> {
  const staffId = text(form, 'staffId');
  const command = text(form, 'command') as StaffCommand;
  const spec = Commands[command];
  if (!spec) return { error: 'Unknown action.' };

  try {
    const result = await authedRequest<StaffDetail | TemporaryPassword>(`/staff/${encodeURIComponent(staffId)}/${spec.path}`, {
      method: 'POST',
      ...(spec.body && { body: spec.body }),
    });
    revalidatePath('/staff');
    revalidatePath(`/staff/${staffId}`);
    return 'temporaryPassword' in result ? { error: null, temporaryPassword: result.temporaryPassword } : { error: null, saved: true };
  } catch (error) {
    return failure(error);
  }
}

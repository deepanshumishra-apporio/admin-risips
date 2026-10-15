'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { ApiError } from '@/lib/api/errors';
import { authedRequest } from '@/lib/auth/session';
import type { Permission, Role } from '@/types/admin-api.types';

export type RoleFormState = { error: string | null; saved?: boolean };

// Role keys go into API paths; the API only ever issues A–Z and underscores.
const RoleKey = /^[A-Z][A-Z_]{0,39}$/;

const text = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
};

const permissions = (form: FormData): Permission[] =>
  form.getAll('permissions').filter((value): value is Permission => typeof value === 'string');

/** API errors become a message on the form; anything else (session redirects included) must reach Next. */
function failure(error: unknown): RoleFormState {
  if (error instanceof ApiError) return { error: error.message };
  throw error;
}

function refresh(): void {
  revalidatePath('/staff', 'layout');
}

export async function createRole(_previous: RoleFormState, form: FormData): Promise<RoleFormState> {
  const name = text(form, 'name');
  const granted = permissions(form);
  if (!name) return { error: 'Give the role a name.' };
  if (granted.length === 0) return { error: 'Choose at least one permission.' };

  let role: Role;
  try {
    role = await authedRequest<Role>('/roles', {
      method: 'POST',
      body: { name, description: text(form, 'description') || null, permissions: granted },
    });
  } catch (error) {
    return failure(error);
  }
  refresh();
  redirect(`/staff/roles/${role.key}`);
}

export async function updateRole(_previous: RoleFormState, form: FormData): Promise<RoleFormState> {
  const key = text(form, 'key');
  if (!RoleKey.test(key)) return { error: 'Unknown role.' };
  const name = text(form, 'name');
  const granted = permissions(form);
  const system = form.get('system') === 'true';
  if (!system && !name) return { error: 'The role needs a name.' };
  if (granted.length === 0) return { error: 'Choose at least one permission.' };

  try {
    await authedRequest<Role>(`/roles/${encodeURIComponent(key)}`, {
      method: 'PATCH',
      // Built-in roles keep their name; only their permissions are sent.
      body: system ? { permissions: granted } : { name, description: text(form, 'description') || null, permissions: granted },
    });
  } catch (error) {
    return failure(error);
  }
  refresh();
  return { error: null, saved: true };
}

export async function deleteRole(_previous: RoleFormState, form: FormData): Promise<RoleFormState> {
  const key = text(form, 'key');
  if (!RoleKey.test(key)) return { error: 'Unknown role.' };
  try {
    await authedRequest(`/roles/${encodeURIComponent(key)}`, { method: 'DELETE' });
  } catch (error) {
    return failure(error);
  }
  refresh();
  redirect('/staff/roles');
}

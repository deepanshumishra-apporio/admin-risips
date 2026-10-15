'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { Field, TextInput } from '@/components/ui/field';
import { FormError, SubmitButton } from '@/features/auth/components/form-parts';
import { createStaff, type StaffFormState } from '@/features/staff/actions';
import { RolePicker } from '@/features/staff/components/role-picker';
import type { StaffLevel } from '@/features/staff/hierarchy';
import { TemporaryPasswordReveal } from '@/features/staff/components/temporary-password';
import type { Role } from '@/types/admin-api.types';

const Initial: StaffFormState = { error: null };

export function CreateStaffForm({ roles, actorLevel }: { roles: Role[]; actorLevel: StaffLevel }): React.JSX.Element {
  const [state, action] = useActionState(createStaff, Initial);

  if (state.temporaryPassword && state.staffId) {
    return (
      <div className="space-y-4">
        <TemporaryPasswordReveal password={state.temporaryPassword} {...(state.email && { email: state.email })} />
        <div className="flex gap-3">
          <Link
            href={`/staff/${state.staffId}`}
            className="inline-flex h-9.5 items-center rounded-md bg-brand px-4 text-[13.5px] font-medium text-white hover:bg-brand-strong"
          >
            Open their account
          </Link>
          <Link href="/staff" className="inline-flex h-9.5 items-center px-2 text-[13.5px] font-medium text-ink-muted hover:text-ink">
            Back to staff
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required>
          <TextInput name="fullName" required maxLength={150} autoComplete="off" />
        </Field>
        <Field label="Work email" required>
          <TextInput name="email" type="email" required maxLength={255} autoComplete="off" />
        </Field>
      </div>
      <Field label="Phone" hint="Optional. For contact only — never used to sign in.">
        <TextInput name="phone" type="tel" maxLength={20} autoComplete="off" />
      </Field>
      <RolePicker roles={roles} selected={[]} actorLevel={actorLevel} />
      <div className="max-w-xs pt-1">
        <SubmitButton>Create account</SubmitButton>
      </div>
    </form>
  );
}

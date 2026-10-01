'use client';

import { CheckCircle2 } from 'lucide-react';
import { useActionState } from 'react';

import { Field, TextInput } from '@/components/ui/field';
import { FormError, SubmitButton } from '@/features/auth/components/form-parts';
import { updateStaff, type StaffFormState } from '@/features/staff/actions';
import { RolePicker } from '@/features/staff/components/role-picker';
import type { Role, StaffDetail } from '@/types/admin-api.types';

const Initial: StaffFormState = { error: null };

type EditStaffFormProps = {
  staff: StaffDetail;
  roles: Role[];
  /** Your own roles are changed by another admin, never by you. */
  isSelf: boolean;
};

export function EditStaffForm({ staff, roles, isSelf }: EditStaffFormProps): React.JSX.Element {
  const [state, action] = useActionState(updateStaff, Initial);
  const locked = staff.status === 'DEACTIVATED';

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="staffId" value={staff.id} />
      <input type="hidden" name="includeRoles" value={String(!isSelf && !locked)} />

      <FormError message={state.error} />
      {state.saved ? (
        <p className="flex items-center gap-2 text-[13px] text-success">
          <CheckCircle2 className="size-4" />
          Saved.
        </p>
      ) : null}

      <fieldset disabled={locked} className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required>
          <TextInput name="fullName" defaultValue={staff.fullName} required maxLength={150} />
        </Field>
        <Field label="Phone">
          <TextInput name="phone" type="tel" defaultValue={staff.phone ?? ''} maxLength={20} />
        </Field>
      </fieldset>

      <RolePicker roles={roles} selected={staff.roles.map((role) => role.key)} disabled={isSelf || locked} />
      {isSelf ? <p className="text-[12.5px] text-ink-muted">Another admin has to change your roles.</p> : null}

      {locked ? null : (
        <div className="max-w-xs">
          <SubmitButton>Save changes</SubmitButton>
        </div>
      )}
    </form>
  );
}

'use client';

import { CheckCircle2, Lock } from 'lucide-react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Field, TextInput } from '@/components/ui/field';
import { FormError } from '@/features/auth/components/form-parts';
import { updateStaff, type StaffFormState } from '@/features/staff/actions';
import { RolePicker } from '@/features/staff/components/role-picker';
import type { StaffLevel } from '@/features/staff/hierarchy';
import type { Role, StaffDetail } from '@/types/admin-api.types';

const Initial: StaffFormState = { error: null };

function SaveRow({ saved }: { saved: boolean | undefined }): React.JSX.Element {
  const { pending } = useFormStatus();
  return (
    <div className="flex items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 items-center rounded-md bg-brand px-4 text-[13.5px] font-medium text-white transition-colors hover:bg-brand-deep disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save'}
      </button>
      {saved && !pending ? (
        <span className="flex items-center gap-1.5 text-[13px] text-success">
          <CheckCircle2 className="size-4" /> Saved
        </span>
      ) : null}
    </div>
  );
}

function LockedNote({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <p className="flex items-center gap-2 text-[12.5px] text-ink-muted">
      <Lock className="size-3.5" /> {children}
    </p>
  );
}

type FormProps = {
  staff: StaffDetail;
  /** False when this person is above the admin's level, or deactivated; the form is then read-only. */
  editable: boolean;
};

/** Name and phone. Anyone who may manage this person — or the person themselves — can change these. */
export function ProfileForm({ staff, editable }: FormProps): React.JSX.Element {
  const [state, action] = useActionState(updateStaff, Initial);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="staffId" value={staff.id} />
      <input type="hidden" name="includeRoles" value="false" />
      <FormError message={state.error} />
      <fieldset disabled={!editable} className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required>
          <TextInput name="fullName" defaultValue={staff.fullName} required maxLength={150} />
        </Field>
        <Field label="Phone">
          <TextInput name="phone" type="tel" defaultValue={staff.phone ?? ''} maxLength={20} placeholder="Optional" />
        </Field>
      </fieldset>
      {editable ? <SaveRow saved={state.saved} /> : null}
    </form>
  );
}

type AccessFormProps = FormProps & {
  roles: Role[];
  actorLevel: StaffLevel;
  /** Shown instead of the save button when access can't be changed here. */
  lockedReason: string | null;
};

/** Level and roles. Sends the current name and phone too, which the update requires. */
export function AccessForm({ staff, roles, actorLevel, lockedReason }: AccessFormProps): React.JSX.Element {
  const [state, action] = useActionState(updateStaff, Initial);
  const editable = lockedReason === null;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="staffId" value={staff.id} />
      <input type="hidden" name="fullName" value={staff.fullName} />
      <input type="hidden" name="phone" value={staff.phone ?? ''} />
      <input type="hidden" name="includeRoles" value={String(editable)} />
      <FormError message={state.error} />
      <RolePicker roles={roles} selected={staff.roles.map((role) => role.key)} disabled={!editable} actorLevel={actorLevel} />
      {editable ? <SaveRow saved={state.saved} /> : <LockedNote>{lockedReason}</LockedNote>}
    </form>
  );
}

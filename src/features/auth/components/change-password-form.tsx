'use client';

import { useActionState } from 'react';

import { Field, PasswordInput } from '@/components/ui/field';
import { changePassword, type FormState } from '@/features/auth/actions';
import { FormError, SubmitButton } from '@/features/auth/components/form-parts';

const Initial: FormState = { error: null };

export function ChangePasswordForm(): React.JSX.Element {
  const [state, action] = useActionState(changePassword, Initial);

  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />

      <Field label="Current password">
        <PasswordInput name="currentPassword" autoComplete="current-password" required autoFocus />
      </Field>
      <Field label="New password" hint="At least 12 characters. A passphrase of a few words works well.">
        <PasswordInput name="newPassword" autoComplete="new-password" minLength={12} required />
      </Field>
      <Field label="Confirm new password">
        <PasswordInput name="confirmPassword" autoComplete="new-password" minLength={12} required />
      </Field>

      <SubmitButton>Save password</SubmitButton>
    </form>
  );
}

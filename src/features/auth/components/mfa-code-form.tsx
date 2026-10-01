'use client';

import { useActionState } from 'react';

import { Field, TextInput } from '@/components/ui/field';
import { verifyMfa, type FormState } from '@/features/auth/actions';
import { FormError, SubmitButton } from '@/features/auth/components/form-parts';

const Initial: FormState = { error: null };

export function MfaCodeForm({ next, label = 'Verify' }: { next: string; label?: string }): React.JSX.Element {
  const [state, action] = useActionState(verifyMfa, Initial);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <FormError message={state.error} />

      <Field label="6-digit code" hint="From Google Authenticator, Microsoft Authenticator or 1Password.">
        <TextInput
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          autoFocus
          placeholder="123 456"
          className="tabular text-center text-[18px] tracking-[0.3em]"
        />
      </Field>

      <SubmitButton>{label}</SubmitButton>
    </form>
  );
}

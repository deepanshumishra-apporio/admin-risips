'use client';

import { Lock, Mail } from 'lucide-react';
import { useActionState } from 'react';

import { Field, PasswordInput, TextInput } from '@/components/ui/field';
import { signIn, type FormState } from '@/features/auth/actions';
import { FormError, SubmitButton } from '@/features/auth/components/form-parts';

const Initial: FormState = { error: null };

export function SignInForm({ next }: { next: string }): React.JSX.Element {
  const [state, action] = useActionState(signIn, Initial);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <FormError message={state.error} />

      <Field label="Work email">
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
          <TextInput name="email" type="email" autoComplete="username" required autoFocus placeholder="you@risips.in" className="pl-9" />
        </div>
      </Field>

      <Field label="Password">
        <PasswordInput
          name="password"
          icon={<Lock />}
          autoComplete="current-password"
          required
          placeholder="Enter your password"
        />
      </Field>

      <div className="pt-2">
        <SubmitButton>Continue</SubmitButton>
      </div>
    </form>
  );
}

'use client';

import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useActionState, useState } from 'react';

import { Field, TextInput } from '@/components/ui/field';
import { signIn, type FormState } from '@/features/auth/actions';
import { FormError, SubmitButton } from '@/features/auth/components/form-parts';

const Initial: FormState = { error: null };

export function SignInForm({ next }: { next: string }): React.JSX.Element {
  const [state, action] = useActionState(signIn, Initial);
  const [showPassword, setShowPassword] = useState(false);

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
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
          <TextInput
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            className="pr-10 pl-9"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-ink-muted hover:text-ink-soft"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>

      <div className="pt-2">
        <SubmitButton>Continue</SubmitButton>
      </div>
    </form>
  );
}

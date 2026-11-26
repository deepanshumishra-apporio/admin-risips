'use client';

import { useActionState, useEffect, useState } from 'react';

import { Field, TextInput } from '@/components/ui/field';
import { verifyMfa, type MfaVerifyState } from '@/features/auth/actions';
import { FormError, SubmitButton } from '@/features/auth/components/form-parts';
import { RecoveryCodes } from '@/features/auth/components/recovery-codes';

const Initial: MfaVerifyState = { error: null };

/**
 * The second sign-in step: the authenticator's 6-digit code, or (`allowRecovery`, once set up) a recovery code for a
 * lost phone. Right after setting up, it shows the new recovery codes before going on.
 */
export function MfaCodeForm({ next, label = 'Verify', allowRecovery = false, onRecoveryCodes }: {
  next: string; label?: string; allowRecovery?: boolean;
  /** Called once the recovery codes are on screen (setup hides its QR code then). */
  onRecoveryCodes?: () => void;
}): React.JSX.Element {
  const [state, action] = useActionState(verifyMfa, Initial);
  const [recovery, setRecovery] = useState(false);
  const shown = Boolean(state.recoveryCodes?.length);
  useEffect(() => {
    if (shown) onRecoveryCodes?.();
  }, [shown, onRecoveryCodes]);

  if (state.recoveryCodes?.length) return <RecoveryCodes codes={state.recoveryCodes} continueTo={state.continueTo ?? next} />;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="mode" value={recovery ? 'recovery' : 'code'} />

      <FormError message={state.error} />

      {recovery ? (
        <Field label="Recovery code" hint="One of the codes you saved when you set up two-factor sign-in. Each works once.">
          <TextInput
            key="recovery"
            name="code"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={9}
            required
            autoFocus
            placeholder="K7QM-4XRT"
            className="tabular text-center text-[18px] tracking-[0.2em] uppercase"
          />
        </Field>
      ) : (
        <Field label="6-digit code" hint="From Google Authenticator, Microsoft Authenticator or 1Password.">
          <TextInput
            key="code"
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
      )}

      <SubmitButton>{label}</SubmitButton>

      {allowRecovery ? (
        <button type="button" onClick={() => setRecovery((r) => !r)} className="block text-[13px] font-medium text-brand hover:underline">
          {recovery ? 'Use the authenticator app instead' : 'Lost your phone? Use a recovery code'}
        </button>
      ) : null}
    </form>
  );
}

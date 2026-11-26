'use client';

import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useActionState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, TextInput } from '@/components/ui/field';
import { renewRecoveryCodes, type MfaVerifyState } from '@/features/auth/actions';
import { FormError, SubmitButton } from '@/features/auth/components/form-parts';
import { RecoveryCodes } from '@/features/auth/components/recovery-codes';
import type { StaffMe } from '@/types/admin-api.types';

const Initial: MfaVerifyState = { error: null };

/** The profile's two-factor card: whether it is on, recovery codes left, and making new ones. */
export function TwoFactorCard({ mfa }: { mfa: StaffMe['mfa'] }): React.JSX.Element {
  const [state, action] = useActionState(renewRecoveryCodes, Initial);
  const low = mfa.enrolled && mfa.recoveryCodesLeft <= 3;

  return (
    <Card>
      <CardHeader
        title="Two-factor sign-in"
        subtitle="Every sign-in asks for a code from your authenticator app."
        action={
          mfa.required && mfa.enrolled ? (
            <Badge tone="success"><ShieldCheck className="mr-1 inline size-3.5" />On</Badge>
          ) : (
            <Badge tone="warn"><ShieldAlert className="mr-1 inline size-3.5" />{mfa.required ? 'Not set up' : 'Off'}</Badge>
          )
        }
      />
      <CardBody className="space-y-4">
        {!mfa.required ? (
          <p className="text-[13px] text-ink-muted">
            {mfa.serverOn
              ? 'An administrator turned two-factor sign-in off for your account: you sign in with your password only. Ask them to turn it back on.'
              : 'This server does not ask for a second factor (STAFF_MFA_ENABLED is off). Production always should.'}
          </p>
        ) : !mfa.enrolled ? (
          <p className="text-[13px] text-ink-muted">You&apos;ll be asked to set up an authenticator app the next time you sign in.</p>
        ) : state.recoveryCodes?.length ? (
          <RecoveryCodes codes={state.recoveryCodes} />
        ) : (
          <>
            <p className={low ? 'text-[13px] text-warn' : 'text-[13px] text-ink-muted'}>
              {mfa.recoveryCodesLeft
                ? `${mfa.recoveryCodesLeft} recovery code${mfa.recoveryCodesLeft === 1 ? '' : 's'} left. Each signs you in once if you lose your phone.`
                : 'You have no recovery codes. Make some now, so a lost phone doesn\'t lock you out.'}
              {low && mfa.recoveryCodesLeft ? ' Make new ones soon.' : ''}
            </p>
            <form action={action} className="flex flex-wrap items-end gap-3">
              <Field label="Current code from your app" className="w-44">
                <TextInput name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required placeholder="123 456" className="tabular" />
              </Field>
              <div className="w-auto">
                <SubmitButton>Make new recovery codes</SubmitButton>
              </div>
            </form>
            <FormError message={state.error} />
            <p className="text-[12px] text-ink-muted">New codes replace the old ones. A lost phone with no codes left needs an administrator to reset your two-factor in Roles &amp; access.</p>
          </>
        )}
      </CardBody>
    </Card>
  );
}

'use client';

import { CheckCircle2 } from 'lucide-react';
import { useActionState } from 'react';

import { FormError, SubmitButton } from '@/features/auth/components/form-parts';
import { giveConsent, type ConsentState } from '@/features/hufs/actions';
import type { HufConsentView } from '@/types/admin-api.types';

function Agreed({ at }: { at: string | null }): React.JSX.Element {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-success/25 bg-success-soft p-4 text-[13.5px] text-success">
      <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-semibold">Thank you. Your consent is recorded{at ? ` (${new Date(at).toLocaleString('en-IN')})` : ''}.</p>
        <p className="mt-1 text-ink-soft">
          Next, NSE will email and text you a link. Open it and confirm with the OTP to activate the HUF&apos;s account.
        </p>
      </div>
    </div>
  );
}

export function ConsentForm({ token, view }: { token: string; view: HufConsentView }): React.JSX.Element {
  const [state, action] = useActionState(giveConsent, { error: null } as ConsentState);
  const current = state.view ?? view;
  if (current.state === 'GIVEN') return <Agreed at={current.agreedAt} />;
  if (current.state !== 'PENDING') {
    return <p className="rounded-md border border-line bg-surface-sunken p-4 text-[13.5px] text-ink-soft">This link has expired. Ask RiSips for a new one.</p>;
  }
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <FormError message={state.error} />
      <label className="flex items-start gap-3 rounded-lg border border-line p-4 text-[13.5px] leading-relaxed text-ink">
        <input type="checkbox" name="agree" required className="mt-1 size-4 shrink-0 accent-[var(--color-brand)]" />
        <span>
          I am the karta of <strong>{current.huf.name}</strong>. The details above are correct. I authorise RiSips to register the HUF
          with NSE Invest for mutual fund investments, and to submit its FATCA/CRS declaration naming me as the HUF&apos;s beneficial
          owner. The HUF is resident in India for tax only, and neither I nor the HUF is a politically exposed person.
        </span>
      </label>
      <div className="max-w-xs">
        <SubmitButton>I agree</SubmitButton>
      </div>
      <p className="text-[12px] text-ink-muted">Your IP address and the time you agree are recorded and sent to NSE as evidence of your consent.</p>
    </form>
  );
}

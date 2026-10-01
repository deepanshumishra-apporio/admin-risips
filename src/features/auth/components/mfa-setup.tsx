'use client';

import { QrCode } from 'lucide-react';
import { useActionState } from 'react';

import { startMfaSetup, type MfaSetupState } from '@/features/auth/actions';
import { FormError, SubmitButton } from '@/features/auth/components/form-parts';
import { MfaCodeForm } from '@/features/auth/components/mfa-code-form';

const Initial: MfaSetupState = { error: null, qrSvg: null, secret: null };

/**
 * Enrolment in two steps: generate a secret (on demand, so reloading the page
 * never silently replaces one already scanned), then prove it with a code.
 */
export function MfaSetup({ next }: { next: string }): React.JSX.Element {
  const [setup, start] = useActionState(startMfaSetup, Initial);

  if (!setup.qrSvg || !setup.secret) {
    return (
      <form action={start} className="space-y-4">
        <FormError message={setup.error} />
        <div className="flex items-start gap-3 rounded-lg border border-line bg-surface-sunken p-3.5">
          <QrCode className="mt-0.5 size-5 shrink-0 text-brand" />
          <p className="text-[13px] leading-relaxed text-ink-soft">
            You&apos;ll need an authenticator app on your phone. We&apos;ll show a QR code to scan, then ask for the
            code it generates.
          </p>
        </div>
        <SubmitButton>Set up authenticator</SubmitButton>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <ol className="space-y-1 text-[13px] text-ink-soft">
        <li>1. Scan this code with your authenticator app.</li>
        <li>2. Enter the 6-digit code it shows.</li>
      </ol>

      <div
        className="mx-auto w-fit rounded-lg border border-line bg-white p-2"
        // Generated on our server from the API's otpauth URI; contains no user input.
        dangerouslySetInnerHTML={{ __html: setup.qrSvg }}
        aria-label="Authenticator QR code"
        role="img"
      />

      <details className="rounded-md border border-line px-3 py-2 text-[12.5px] text-ink-muted">
        <summary className="cursor-pointer font-medium text-ink-soft">Can&apos;t scan? Enter the key instead</summary>
        <code className="tabular mt-2 block break-all text-[13px] tracking-wider text-ink">
          {setup.secret.match(/.{1,4}/g)?.join(' ')}
        </code>
      </details>

      <MfaCodeForm next={next} label="Confirm and continue" />
    </div>
  );
}

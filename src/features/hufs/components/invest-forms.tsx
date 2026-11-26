'use client';

import { Check, Copy, Loader2 } from 'lucide-react';
import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Field, SelectInput, TextInput } from '@/components/ui/field';
import {
  cancelSip, payByNeft, placeRedemption, refreshInvestments, refreshRequestLink, registerMandate, type InvestState,
} from '@/features/hufs/invest-actions';
import { cn } from '@/utils/cn';

const Initial: InvestState = { error: null };

const newKey = (): string => crypto.randomUUID().replace(/-/g, '');

/**
 * The form's one-time key. The admin backend refuses a second request with the same key, so a double click or a
 * resubmit after NSE timed out can't place a second real order. A new key comes only after a success, for the next one.
 */
export function RequestKey({ state }: { state: InvestState }): React.JSX.Element {
  const [key, setKey] = useState(newKey);
  useEffect(() => {
    if (state.done) setKey(newKey());
  }, [state]);
  return <input type="hidden" name="requestKey" value={key} />;
}

function Submit({ children, primary = false }: { children: React.ReactNode; primary?: boolean }): React.JSX.Element {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'inline-flex h-9 items-center justify-center gap-2 rounded-md px-3.5 text-[13.5px] font-semibold transition-colors disabled:cursor-wait disabled:opacity-70',
        primary ? 'bg-brand text-white hover:bg-brand-strong' : 'border border-line-strong bg-surface text-ink hover:bg-surface-sunken',
      )}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function CopyLink({ url }: { url: string }): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  return (
    <span className="flex min-w-0 items-center gap-2 rounded-md border border-line bg-surface-sunken p-1.5">
      <code className="min-w-0 flex-1 truncate text-[12px] text-ink" title={url}>{url}</code>
      <button
        type="button"
        onClick={() => void navigator.clipboard.writeText(url).then(() => setCopied(true))}
        className="inline-flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-[12px] font-semibold text-brand hover:bg-brand-soft"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </span>
  );
}

function Outcome({ state, linkLabel }: { state: InvestState; linkLabel?: string }): React.JSX.Element | null {
  if (state.error) return <p role="alert" className="text-[12.5px] text-danger">{state.error}</p>;
  if (!state.done) return null;
  return (
    <div role="status" className="space-y-1.5 text-[12.5px] text-success">
      <p>{state.done}</p>
      {state.link && linkLabel ? (
        <>
          <p className="text-ink-soft">{linkLabel}</p>
          <CopyLink url={state.link} />
        </>
      ) : null}
    </div>
  );
}

/** An eNACH mandate on the HUF's account: needed before a SIP. */
export function MandateForm({ hufId }: { hufId: string }): React.JSX.Element {
  const [state, action] = useActionState(registerMandate, Initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={hufId} />
      <RequestKey state={state} />
      <Field label="Mandate limit (₹)" hint="The most one debit can take, across all SIPs on it. ₹1,00,000 is usual. Runs 40 years, NSE's maximum." required>
        <TextInput name="amount" inputMode="numeric" defaultValue="100000" required />
      </Field>
      <Submit>Register eNACH mandate</Submit>
      <Outcome state={state} linkLabel="The karta approves it with their bank here:" />
    </form>
  );
}

/** Sells from one folio: by amount, by units, or everything. Opens from a "Redeem" toggle so the table stays short. */
export function RedeemForm({ hufId, schemeCode, folio, units }: { hufId: string; schemeCode: string; folio: string; units: number }): React.JSX.Element {
  const [state, action] = useActionState(placeRedemption, Initial);
  const [by, setBy] = useState<'amount' | 'units' | 'all'>('amount');
  return (
    <details className="rounded-md border border-line px-3 py-2">
      <summary className="cursor-pointer text-[13px] font-semibold text-ink">Redeem from folio {folio}</summary>
      <form action={action} className="mt-3 space-y-3">
        <input type="hidden" name="id" value={hufId} />
        <RequestKey state={state} />
        <input type="hidden" name="schemeCode" value={schemeCode} />
        <input type="hidden" name="folio" value={folio} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Redeem" required>
            <SelectInput name="by" value={by} onChange={(e) => setBy(e.target.value as 'amount' | 'units' | 'all')}>
              <option value="amount">An amount (₹)</option>
              <option value="units">A number of units</option>
              <option value="all">All units ({units})</option>
            </SelectInput>
          </Field>
          {by === 'all' ? null : (
            <Field label={by === 'units' ? `Units (up to ${units})` : 'Amount (₹)'} required>
              <TextInput name="value" inputMode="decimal" required />
            </Field>
          )}
        </div>
        <label className="flex items-start gap-2 text-[12.5px] text-ink-soft">
          <input type="checkbox" name="confirm" className="mt-0.5" />
          The investor asked for this redemption. The money goes to its registered bank account.
        </label>
        <Submit primary>Place redemption on NSE</Submit>
        <Outcome state={state} linkLabel="The karta or signatory authorises it here:" />
      </form>
    </details>
  );
}

/** Stops a SIP with one of NSE's reasons; NSE then needs the investor to authorise it. */
export function StopSipForm({ hufId, regNo, reasons }: { hufId: string; regNo: string; reasons: Record<string, string> }): React.JSX.Element {
  const [state, action] = useActionState(cancelSip, Initial);
  const [reason, setReason] = useState('');
  return (
    <details className="w-full">
      <summary className="cursor-pointer text-[12.5px] font-semibold text-danger">Stop this SIP</summary>
      <form action={action} className="mt-2 space-y-2.5">
        <input type="hidden" name="id" value={hufId} />
        <RequestKey state={state} />
        <input type="hidden" name="regNo" value={regNo} />
        <Field label="Reason (NSE's list)" required>
          <SelectInput name="reason" value={reason} onChange={(e) => setReason(e.target.value)} required>
            <option value="" disabled>
              Choose…
            </option>
            {Object.entries(reasons).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </SelectInput>
        </Field>
        {reason === '13' ? (
          <Field label="The reason" required>
            <TextInput name="other" maxLength={90} required />
          </Field>
        ) : null}
        <label className="flex items-start gap-2 text-[12.5px] text-ink-soft">
          <input type="checkbox" name="confirm" className="mt-0.5" />
          The investor asked to stop this SIP.
        </label>
        <Submit>Send cancellation to NSE</Submit>
        <Outcome state={state} linkLabel="The karta or signatory authorises the cancellation here:" />
      </form>
    </details>
  );
}

export function RefreshInvestments({ hufId }: { hufId: string }): React.JSX.Element {
  const [state, action] = useActionState(refreshInvestments, Initial);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={hufId} />
      <Submit>Refresh from NSE</Submit>
      <Outcome state={state} />
    </form>
  );
}

/** Pays a placed purchase by NEFT/RTGS: the UTR of the transfer from the investor's registered account. */
export function NeftPayment({ hufId, requestId }: { hufId: string; requestId: string }): React.JSX.Element {
  const [state, action] = useActionState(payByNeft, Initial);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={hufId} />
      <input type="hidden" name="requestId" value={requestId} />
      <label className="text-[12px] text-ink-muted" htmlFor={`utr-${requestId}`}>
        Paid by NEFT/RTGS? UTR
      </label>
      <input
        id={`utr-${requestId}`}
        name="utr"
        maxLength={30}
        autoComplete="off"
        className="h-8 w-56 rounded-md border border-line-strong bg-surface px-2 text-[13px] uppercase"
        placeholder="e.g. HDFCR52026112412345678"
      />
      <Submit>Send to NSE</Submit>
      {state.error ? <span className="text-[12px] text-danger">{state.error}</span> : null}
      {state.done ? <span className="text-[12px] text-success">{state.done}</span> : null}
    </form>
  );
}

export function RequestLink({ hufId, requestId }: { hufId: string; requestId: string }): React.JSX.Element {
  const [state, action] = useActionState(refreshRequestLink, Initial);
  return (
    <form action={action} className="inline-flex items-center gap-2">
      <input type="hidden" name="id" value={hufId} />
      <input type="hidden" name="requestId" value={requestId} />
      <Submit>Get link</Submit>
      {state.error ? <span className="text-[12px] text-danger">{state.error}</span> : null}
    </form>
  );
}

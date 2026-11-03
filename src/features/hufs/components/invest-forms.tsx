'use client';

import { Check, Copy, Loader2 } from 'lucide-react';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Field, SelectInput, TextInput } from '@/components/ui/field';
import {
  placePurchase, refreshInvestments, refreshRequestLink, registerMandate, registerSip, type InvestState,
} from '@/features/hufs/invest-actions';
import type { HufInvestmentsView, HufScheme } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

const Initial: InvestState = { error: null };

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

const money = (n: number | null | undefined) => (n === null || n === undefined ? '—' : `₹${n.toLocaleString('en-IN')}`);

/** A lumpsum purchase. The karta confirms it with an OTP and pays from the HUF's account on NSE's page. */
export function PurchaseForm({ hufId, scheme, folios, live }: { hufId: string; scheme: HufScheme; folios: string[]; live: boolean }): React.JSX.Element {
  const [state, action] = useActionState(placePurchase, Initial);
  const [folio, setFolio] = useState('');
  const min = folio ? scheme.minAdditional : scheme.minFresh;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={hufId} />
      <input type="hidden" name="schemeCode" value={scheme.schemeCode} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Amount (₹)" hint={`Minimum ${money(min)}${scheme.multiplier && scheme.multiplier > 1 ? `, in multiples of ₹${scheme.multiplier}` : ''}`} required>
          <TextInput name="amount" inputMode="decimal" required placeholder={String(min ?? '')} />
        </Field>
        <Field label="Folio" hint={folios.length ? 'An existing folio makes it an additional purchase' : 'A new folio is opened'}>
          <SelectInput name="folio" value={folio} onChange={(e) => setFolio(e.target.value)}>
            <option value="">New folio (fresh purchase)</option>
            {folios.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
      <label className="flex items-start gap-2 text-[12.5px] text-ink-soft">
        <input type="checkbox" name="confirm" className="mt-0.5 accent-[var(--color-brand)]" />
        Place this order on NSE{live ? "'s live account" : ''}. NSE sends the karta a link to confirm it and pay from the HUF&apos;s own bank account; pay before{' '}
        {scheme.cutoff || '3 PM'} for today&apos;s NAV.
      </label>
      <Submit primary>Place order</Submit>
      <Outcome state={state} linkLabel="NSE's payment link for the karta (NSE also emails and texts it):" />
    </form>
  );
}

/** An eNACH mandate on the HUF's account: needed before a SIP. */
export function MandateForm({ hufId }: { hufId: string }): React.JSX.Element {
  const [state, action] = useActionState(registerMandate, Initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={hufId} />
      <Field label="Mandate limit (₹)" hint="The most one debit can take, across all SIPs on it. ₹1,00,000 is usual. Runs 40 years, NSE's maximum." required>
        <TextInput name="amount" inputMode="numeric" defaultValue="100000" required />
      </Field>
      <Submit>Register eNACH mandate</Submit>
      <Outcome state={state} linkLabel="The karta approves it with their bank here:" />
    </form>
  );
}

/** A monthly SIP on an approved mandate. */
export function SipForm({ hufId, scheme, mandates, live }: {
  hufId: string; scheme: HufScheme; mandates: HufInvestmentsView['approvedMandates']; live: boolean;
}): React.JSX.Element {
  const [state, action] = useActionState(registerSip, Initial);
  const rule = scheme.sipMonthly;
  if (!rule) return <p className="text-[13px] text-ink-muted">This scheme doesn&apos;t take monthly SIPs.</p>;
  if (!mandates.length) return <p className="text-[13px] text-ink-muted">A SIP needs a mandate the karta&apos;s bank has approved. Register one first.</p>;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={hufId} />
      <input type="hidden" name="schemeCode" value={scheme.schemeCode} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Monthly amount (₹)" hint={`Minimum ${money(rule.minAmount)}`} required>
          <TextInput name="amount" inputMode="decimal" required />
        </Field>
        <Field label="Mandate" required>
          <SelectInput name="mandateId" required>
            {mandates.map((m) => (
              <option key={m.mandateId} value={m.mandateId}>
                {m.mandateId} · up to {money(m.amount)}{m.bankName ? ` · ${m.bankName}` : ''}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="First instalment" hint={`On day ${rule.dates.join(', ')}; at least ${Math.max(rule.minGapDays ?? 0, 7)} days from today`} required>
          <TextInput type="date" name="startDate" required />
        </Field>
        <Field label="Instalments" hint={`${rule.minInstallments ?? 1} to ${rule.maxInstallments ?? 999}`} required>
          <TextInput name="installments" inputMode="numeric" defaultValue="60" required />
        </Field>
      </div>
      <label className="flex items-start gap-2 text-[12.5px] text-ink-soft">
        <input type="checkbox" name="confirm" className="mt-0.5 accent-[var(--color-brand)]" />
        Register this SIP on NSE{live ? "'s live account" : ''}. NSE sends the karta a link to approve it; each instalment is then debited from the mandate.
      </label>
      <Submit primary>Register SIP</Submit>
      <Outcome state={state} linkLabel="The karta approves the SIP here:" />
    </form>
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

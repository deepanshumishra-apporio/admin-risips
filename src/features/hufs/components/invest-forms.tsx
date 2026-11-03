'use client';

import { Check, Copy, Loader2 } from 'lucide-react';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Field, TextInput } from '@/components/ui/field';
import {
  refreshInvestments, refreshRequestLink, registerMandate, type InvestState,
} from '@/features/hufs/invest-actions';
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

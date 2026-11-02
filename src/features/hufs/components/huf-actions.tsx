'use client';

import { Check, Copy, Loader2 } from 'lucide-react';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import {
  approveHuf, cancelHuf, createConsentLink, markHufActive, refreshHuf, resendHufLink, type HufActionState,
} from '@/features/hufs/actions';
import { cn } from '@/utils/cn';

const Initial: HufActionState = { error: null };

function Button({ children, tone = 'secondary' }: { children: React.ReactNode; tone?: 'primary' | 'secondary' | 'danger' }): React.JSX.Element {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'inline-flex h-9 items-center justify-center gap-2 rounded-md px-3.5 text-[13.5px] font-semibold transition-colors disabled:cursor-wait disabled:opacity-70',
        tone === 'primary' && 'bg-brand text-white hover:bg-brand-strong',
        tone === 'secondary' && 'border border-line-strong bg-surface text-ink hover:bg-surface-sunken',
        tone === 'danger' && 'border border-danger/30 bg-surface text-danger hover:bg-danger-soft',
      )}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

function Outcome({ state }: { state: HufActionState }): React.JSX.Element | null {
  if (state.error) return <p role="alert" className="text-[12.5px] text-danger">{state.error}</p>;
  if (state.done) return <p role="status" className="text-[12.5px] text-success">{state.done}</p>;
  return null;
}

function CopyLink({ url }: { url: string }): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 rounded-md border border-line bg-surface-sunken p-2">
        <code className="min-w-0 flex-1 truncate text-[12px] text-ink" title={url}>{url}</code>
        <button
          type="button"
          onClick={() => void navigator.clipboard.writeText(url).then(() => setCopied(true))}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-[12px] font-semibold text-brand hover:bg-brand-soft"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="text-[12px] text-ink-muted">Shown only now. Send it to the karta yourself (WhatsApp, SMS or email); it works for 7 days.</p>
    </div>
  );
}

export function ConsentLinkAction({ id, again }: { id: string; again: boolean }): React.JSX.Element {
  const [state, action] = useActionState(createConsentLink, Initial);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      {state.consentUrl ? <CopyLink url={state.consentUrl} /> : <Button tone="primary">{again ? 'Create a new consent link' : 'Create consent link for the karta'}</Button>}
      {state.consentUrl ? null : <Outcome state={state} />}
    </form>
  );
}

export function ApproveAction({ id, duplicateCodes, live }: { id: string; duplicateCodes: string[]; live: boolean }): React.JSX.Element {
  const [state, action] = useActionState(approveHuf, Initial);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      {duplicateCodes.length ? (
        <label className="flex items-start gap-2 text-[12.5px] text-ink-soft">
          <input type="checkbox" name="allowNewClientCode" className="mt-0.5 accent-[var(--color-brand)]" />
          NSE already has this PAN as {duplicateCodes.join(', ')}. Create this new client code anyway.
        </label>
      ) : null}
      <Button tone="primary">{live ? "Approve and send to NSE's live account" : 'Approve and send to NSE (UAT)'}</Button>
      <Outcome state={state} />
    </form>
  );
}

export function RefreshAction({ id }: { id: string }): React.JSX.Element {
  const [state, action] = useActionState(refreshHuf, Initial);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <Button>Refresh from NSE</Button>
      <Outcome state={state} />
    </form>
  );
}

export function ResendAction({ id }: { id: string }): React.JSX.Element {
  const [state, action] = useActionState(resendHufLink, Initial);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <Button>Re-send the karta&apos;s NSE link</Button>
      <Outcome state={state} />
    </form>
  );
}

export function MarkActiveAction({ id }: { id: string }): React.JSX.Element {
  const [state, action] = useActionState(markHufActive, Initial);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <input
        name="note"
        maxLength={500}
        placeholder="How you know, e.g. order 4630… accepted"
        className="h-9 w-full rounded-md border border-line-strong bg-surface px-3 text-[13px] text-ink focus:border-brand focus:ring-3 focus:ring-brand/12 focus:outline-none"
      />
      <Button>Mark active</Button>
      <Outcome state={state} />
    </form>
  );
}

export function CancelAction({ id }: { id: string }): React.JSX.Element {
  const [state, action] = useActionState(cancelHuf, Initial);
  return (
    <form action={action} className="space-y-2" onSubmit={(event) => { if (!window.confirm('Cancel this HUF? It has not been sent to NSE.')) event.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      <Button tone="danger">Cancel this HUF</Button>
      <Outcome state={state} />
    </form>
  );
}

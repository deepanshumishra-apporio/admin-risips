'use client';

import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { SidePanel } from '@/components/ui/side-panel';
import { runSipAction, sendSipOtp, type SipAction } from '@/features/sips/actions';
import type { SipDetail } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

const Titles: Record<SipAction, string> = {
  sip_modify: 'Modify SIP',
  sip_pause: 'Pause SIP',
  sip_resume: 'Resume SIP',
  sip_cancel: 'Cancel SIP',
  redeem: 'Redeem',
};

const ConfirmLabels: Record<SipAction, string> = {
  sip_modify: 'Confirm change',
  sip_pause: 'Confirm pause',
  sip_resume: 'Confirm resume',
  sip_cancel: 'Confirm cancellation',
  redeem: 'Confirm redemption',
};

const CancelReasons = [
  ['invest_later', 'Will invest later'],
  ['amount_not_available', 'Money not available'],
  ['investment_returns_not_as_expected', 'Returns not as expected'],
  ['investment_goal_complete', 'Goal reached'],
  ['switch_to_other_scheme', 'Moving to another fund'],
  ['mandate_not_ready', 'AutoPay not ready'],
  ['exit_load_not_as_expected', 'Exit load not as expected'],
  ['fund_manager_changed', 'Fund manager changed'],
  ['amc_support_not_satisfactory', 'Fund house support'],
  ['customer_support_not_satisfactory', 'Our support'],
] as const;

const Control =
  'h-9 w-full rounded-md border border-line-strong bg-surface px-3 text-[13.5px] text-ink focus:border-brand focus:ring-3 focus:ring-brand/12 focus:outline-none';
const Primary = 'inline-flex h-9.5 items-center justify-center gap-2 rounded-md bg-brand px-4 text-[13.5px] font-medium text-white hover:bg-brand-strong disabled:opacity-60';
const Secondary = 'inline-flex h-9.5 items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-4 text-[13.5px] font-medium text-ink hover:bg-surface-sunken disabled:opacity-60';

type Step = 'details' | 'otp' | 'done';

function Label({ text, children }: { text: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] text-ink-soft">{text}</span>
      {children}
    </label>
  );
}

/**
 * Modify / Pause (or Resume) / Redeem / Cancel, done for the investor with their consent: the app backend sends them an
 * OTP, they read it out to staff, and the action runs the app's own code with it. They get an email with the details.
 */
export function SipActions({ sip, canAct }: { sip: SipDetail; canAct: boolean }): React.JSX.Element {
  const router = useRouter();
  const [action, setAction] = useState<SipAction | null>(null);
  const [step, setStep] = useState<Step>('details');
  const [fields, setFields] = useState<Record<string, string | number | boolean>>({});
  const [otp, setOtp] = useState('');
  const [sentTo, setSentTo] = useState<string>('');
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ summary: string; sipId: string; orderRef: string | null } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (step !== 'otp') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [step]);

  const live = ['ACTIVE', 'PAUSED', 'BOUNCED', 'AWAITING_PAYMENT'].includes(sip.status);
  const paused = sip.status === 'PAUSED';
  const why = canAct ? undefined : 'Needs the "Pause, resume, change or cancel SIPs" permission.';

  const open = (a: SipAction): void => {
    setAction(a);
    setStep('details');
    setOtp('');
    setError(null);
    setDone(null);
    setFields(
      a === 'sip_modify' ? { amount: Number(sip.amount), day: sip.sipDay ?? 5 }
        : a === 'sip_pause' ? { months: 1 }
          : a === 'sip_cancel' ? { code: 'invest_later' }
            : a === 'redeem' ? { all: false, amount: '' }
              : {},
    );
  };
  const close = (): void => {
    if (done) router.push(`/orders/sips/${done.sipId}`);
    setAction(null);
    router.refresh();
  };

  const sendCode = (): void => {
    if (!action) return;
    setError(null);
    start(async () => {
      const r = await sendSipOtp(sip.id, action);
      if (!r.ok) return setError(r.error);
      setSentTo([r.sentTo.mobile, r.sentTo.email].filter(Boolean).join(' and ') || 'the investor');
      setResendAt(Date.now() + r.resendIn * 1000);
      setStep('otp');
    });
  };
  const confirm = (): void => {
    if (!action) return;
    setError(null);
    start(async () => {
      const r = await runSipAction(sip.id, action, fields, otp.trim());
      if (!r.ok) {
        setError(r.error);
        if (r.otpProblem) setOtp('');
        return;
      }
      setDone({ summary: r.summary, sipId: r.sipId, orderRef: r.orderRef });
      setStep('done');
    });
  };

  const set = (k: string, v: string | number | boolean): void => setFields((f) => ({ ...f, [k]: v }));
  const detailsValid =
    action === 'sip_modify' ? Number(fields['amount']) >= 100 && Number(fields['day']) >= 1 && Number(fields['day']) <= 28
      : action === 'redeem' ? fields['all'] === true || Number(fields['amount']) >= 100
        : true;

  const button = (a: SipAction, label: string, tone: 'plain' | 'danger' = 'plain', show = true): React.JSX.Element | null =>
    show ? (
      <button
        type="button"
        disabled={!canAct}
        title={why}
        onClick={() => open(a)}
        className={cn(
          'inline-flex h-9.5 items-center rounded-md border px-4 text-[13.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          tone === 'danger' ? 'border-danger text-danger hover:bg-danger-soft' : 'border-line-strong bg-surface text-ink hover:bg-surface-sunken',
        )}
      >
        {label}
      </button>
    ) : null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {button('sip_modify', 'Modify SIP', 'plain', live && !paused)}
        {button(paused ? 'sip_resume' : 'sip_pause', paused ? 'Resume SIP' : 'Pause SIP', 'plain', live)}
        {button('redeem', 'Redeem', 'plain', !!sip.folio)}
        {button('sip_cancel', 'Cancel SIP', 'danger', live)}
      </div>

      <SidePanel
        open={action !== null}
        title={action ? Titles[action] : ''}
        subtitle={`${sip.scheme} · ${sip.investor?.name ?? 'Investor'}`}
        onClose={close}
        footer={
          step === 'details' ? (
            <div className="flex justify-end gap-2">
              <button type="button" className={Secondary} onClick={close}>
                Close
              </button>
              <button type="button" className={Primary} disabled={!detailsValid || pending} onClick={sendCode}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                Send OTP to investor
              </button>
            </div>
          ) : step === 'otp' ? (
            <div className="flex justify-end gap-2">
              <button type="button" className={Secondary} disabled={pending} onClick={() => setStep('details')}>
                Back
              </button>
              <button type="button" className={Primary} disabled={!/^\d{6}$/.test(otp.trim()) || pending} onClick={confirm}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                {action ? ConfirmLabels[action] : 'Confirm'}
              </button>
            </div>
          ) : (
            <div className="flex justify-end">
              <button type="button" className={Primary} onClick={close}>
                Done
              </button>
            </div>
          )
        }
      >
        <div className="space-y-4 text-[13.5px]">
          {step === 'details' ? (
            <>
              {action === 'sip_modify' ? (
                <>
                  <Label text="New SIP amount (₹)">
                    <input type="number" min={100} step={1} inputMode="numeric" className={Control} value={String(fields['amount'] ?? '')} onChange={(e) => set('amount', e.target.value)} />
                  </Label>
                  <Label text="SIP date (day of the month)">
                    <select className={Control} value={String(fields['day'] ?? 5)} onChange={(e) => set('day', Number(e.target.value))}>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </Label>
                  <p className="text-[12.5px] text-ink-muted">FP can&apos;t edit a SIP, so this registers a new SIP on the same folio and AutoPay and cancels the old one.</p>
                </>
              ) : null}
              {action === 'sip_pause' ? (
                <Label text="Pause for">
                  <select className={Control} value={String(fields['months'] ?? 1)} onChange={(e) => set('months', Number(e.target.value))}>
                    <option value={1}>1 month (skip the next instalment)</option>
                    <option value={2}>2 months (the most allowed)</option>
                  </select>
                </Label>
              ) : null}
              {action === 'sip_resume' ? <p className="text-ink-soft">The skipped instalments are put back; the SIP debits again from its next date.</p> : null}
              {action === 'sip_cancel' ? (
                <>
                  <Label text="Reason">
                    <select className={Control} value={String(fields['code'])} onChange={(e) => set('code', e.target.value)}>
                      {CancelReasons.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </Label>
                  <p className="text-[12.5px] text-danger">No more instalments will be debited. This can&apos;t be undone; units already bought stay invested.</p>
                </>
              ) : null}
              {action === 'redeem' ? (
                <>
                  <p className="text-ink-soft">
                    From folio <span className="tabular font-medium text-ink">{sip.folio}</span> in {sip.scheme}. The money goes to the investor&apos;s bank account.
                  </p>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={fields['all'] === true} onChange={(e) => set('all', e.target.checked)} />
                    Redeem all units
                  </label>
                  {fields['all'] === true ? null : (
                    <Label text="Amount (₹, at least 100)">
                      <input type="number" min={100} step={1} inputMode="numeric" className={Control} value={String(fields['amount'] ?? '')} onChange={(e) => set('amount', e.target.value)} />
                    </Label>
                  )}
                </>
              ) : null}
              <div className="flex gap-2 rounded-md bg-surface-sunken p-3 text-[12.5px] text-ink-soft">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
                <span>
                  RiSips sends the investor a one-time code. Ask them to read it to you; nothing changes without it. They get an email with the
                  details once it&apos;s done.
                </span>
              </div>
            </>
          ) : null}

          {step === 'otp' ? (
            <>
              <p className="text-ink-soft">
                Code sent to <span className="font-medium text-ink">{sentTo}</span>. It works for 5 minutes.
              </p>
              <Label text="Code the investor read out">
                <input
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className={cn(Control, 'tabular text-center text-[18px] tracking-[0.4em]')}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </Label>
              <button type="button" className="text-[13px] font-medium text-brand disabled:text-ink-muted" disabled={pending || now < resendAt} onClick={sendCode}>
                {now < resendAt ? `Resend code in ${Math.ceil((resendAt - now) / 1000)} s` : 'Resend code'}
              </button>
            </>
          ) : null}

          {step === 'done' && done ? (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-[15px] font-semibold text-success">
                <CheckCircle2 className="size-5" />
                {done.summary}
              </p>
              {done.orderRef ? (
                <p className="text-ink-soft">
                  Order <span className="tabular font-medium text-ink">{done.orderRef}</span> is with the fund house.
                </p>
              ) : null}
              <p className="text-ink-soft">The investor gets an email with the details within about 10 minutes.</p>
            </div>
          ) : null}

          {error ? <p className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">{error}</p> : null}
        </div>
      </SidePanel>
    </>
  );
}

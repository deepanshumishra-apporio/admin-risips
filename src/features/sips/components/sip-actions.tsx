'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';

import { Modal } from '@/components/ui/modal';
import { runSipAction, sendSipOtp, type SipAction } from '@/features/sips/actions';
import type { SipDetail } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatDate, formatInrString } from '@/utils/format';

const Titles: Record<SipAction, string> = {
  sip_modify: 'Modify SIP',
  sip_pause: 'Pause SIP',
  sip_resume: 'Resume SIP',
  sip_cancel: 'Cancel SIP',
  redeem: 'Redeem',
};

/** FP's cancellation codes (the app backend passes one on). */
const CancelReasons = [
  ['invest_later', 'Investor request: will invest later'],
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

/** Staff's own reason for a pause: kept in the audit log. */
const PauseReasons = ['Investor request', 'Short of funds this month', 'Travelling', 'Changing bank account', 'Other'] as const;

const Control =
  'h-9.5 w-full rounded-md border border-line-strong bg-surface px-3 text-[13.5px] text-ink focus:border-brand focus:ring-3 focus:ring-brand/12 focus:outline-none disabled:bg-surface-sunken disabled:text-ink-soft';
const Primary =
  'inline-flex h-9.5 items-center justify-center gap-2 rounded-md bg-brand px-4 text-[13.5px] font-medium text-white hover:bg-brand-strong disabled:opacity-60';
const Danger =
  'inline-flex h-9.5 items-center justify-center gap-2 rounded-md bg-danger px-4 text-[13.5px] font-medium text-white hover:opacity-90 disabled:opacity-60';
const Secondary =
  'inline-flex h-9.5 items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-4 text-[13.5px] font-medium text-ink hover:bg-surface-sunken disabled:opacity-60';

type Step = 'details' | 'otp' | 'done';
type Fields = Record<string, string | number | boolean>;

const ordinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};
const dateOf = (d: string | null | undefined): string => (d ? formatDate(d) : '—');
const inr = (n: number | string | null | undefined): string =>
  formatInrString(n === null || n === undefined || n === '' ? null : String(n), { compact: false });
const clock = (s: number): string => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/** The same day N months on, kept inside the month (31 Jan + 1 → 28/29 Feb). */
function addMonths(iso: string, months: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}

/** SEBI's limit for redemption payouts: 3 working days (weekends skipped; holidays aren't known here). */
function workingDaysFromToday(days: number): string {
  const d = new Date();
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) left -= 1;
  }
  return d.toISOString().slice(0, 10);
}

function Label({ text, children }: { text: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-medium text-ink-soft">{text}</span>
      {children}
    </label>
  );
}

/** The grey summary box: label on the left, value on the right. */
function Summary({ rows }: { rows: [string, React.ReactNode][] }): React.JSX.Element {
  return (
    <dl className="space-y-1.5 rounded-md border border-line bg-surface-sunken px-3.5 py-3 text-[13px]">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-soft">{label}</dt>
          <dd className="tabular text-right font-semibold text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Six one-digit boxes: typing moves on, Backspace moves back, a pasted code fills them all. */
function OtpBoxes({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }): React.JSX.Element {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');
  const put = (from: number, text: string): void => {
    const clean = text.replace(/\D/g, '');
    if (!clean) return;
    const next = (value.slice(0, from) + clean).slice(0, 6);
    onChange(next);
    refs.current[Math.min(next.length, 5)]?.focus();
  };
  return (
    <div className="flex gap-2" role="group" aria-label="6-digit code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          autoFocus={i === 0}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1}`}
          value={d}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            if (!e.target.value) {
              onChange(value.slice(0, i));
              return;
            }
            put(i, e.target.value.replace(d, '') || e.target.value);
          }}
          onPaste={(e) => {
            e.preventDefault();
            put(0, e.clipboardData.getData('text'));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !d && i > 0) {
              onChange(value.slice(0, i - 1));
              refs.current[i - 1]?.focus();
            }
          }}
          className="tabular h-11 w-10 rounded-md border border-line-strong bg-surface text-center text-[18px] font-semibold text-ink focus:border-brand focus:ring-3 focus:ring-brand/12 focus:outline-none disabled:opacity-60"
        />
      ))}
    </div>
  );
}

/**
 * Modify / Pause (or Resume) / Redeem / Cancel, done for the investor with their consent. Step 1 collects the details;
 * step 2 sends the investor an OTP, they read it out, and the action runs the app's own code with it. The investor gets
 * an email with the details.
 */
export function SipActions({ sip, canAct }: { sip: SipDetail; canAct: boolean }): React.JSX.Element {
  const router = useRouter();
  const [action, setAction] = useState<SipAction | null>(null);
  const [step, setStep] = useState<Step>('details');
  const [fields, setFields] = useState<Fields>({});
  const [otp, setOtp] = useState('');
  const [sentTo, setSentTo] = useState<{ mobile: string | null; email: string | null }>({ mobile: null, email: null });
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
  const monthly = sip.frequency === 'monthly';
  const why = canAct ? undefined : 'Needs the "Pause, resume, change or cancel SIPs" permission.';
  const currentAmount = Number(sip.amount);
  const mandateMax = sip.mandate?.maxAmount ? Number(sip.mandate.maxAmount) : null;
  const lastPaid = sip.instalments.find((i) => i.status === 'SUCCESS')?.date ?? null;
  const redeemable = sip.holding?.redeemable ? Number(sip.holding.redeemable) : null;

  const open = (a: SipAction): void => {
    setAction(a);
    setStep('details');
    setOtp('');
    setError(null);
    setDone(null);
    setFields(
      a === 'sip_modify'
        ? { amount: String(currentAmount || ''), day: sip.sipDay ?? 5 }
        : a === 'sip_pause'
          ? { months: 1, reason: PauseReasons[0] }
          : a === 'sip_cancel'
            ? { code: 'invest_later', remarks: '' }
            : a === 'redeem'
              ? { all: false, amount: '' }
              : {},
    );
  };
  const close = (): void => {
    if (pending) return;
    if (done) router.push(`/orders/sips/${done.sipId}`);
    setAction(null);
    router.refresh();
  };

  const sendCode = (): void => {
    if (!action) return;
    setError(null);
    start(async () => {
      const r = await sendSipOtp(sip.id, action);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setSentTo(r.sentTo);
      setResendAt(Date.now() + r.resendIn * 1000);
      setNow(Date.now());
      setOtp('');
      setStep('otp');
    });
  };
  const confirm = (): void => {
    if (!action) return;
    setError(null);
    start(async () => {
      const r = await runSipAction(sip.id, action, fields, otp);
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

  const newAmount = Number(fields['amount']);
  const newDay = Number(fields['day']);
  const modifyChanged = newAmount !== currentAmount || newDay !== sip.sipDay;
  const overMandate = action === 'sip_modify' && mandateMax !== null && newAmount > mandateMax;
  const overHolding = action === 'redeem' && fields['all'] !== true && redeemable !== null && newAmount > redeemable;
  const detailsValid =
    action === 'sip_modify'
      ? Number.isInteger(newAmount) && newAmount >= 100 && newDay >= 1 && newDay <= 28 && modifyChanged && !overMandate
      : action === 'redeem'
        ? fields['all'] === true || (Number.isInteger(newAmount) && newAmount >= 100 && !overHolding)
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
          tone === 'danger'
            ? 'border-danger bg-danger-soft text-danger hover:bg-danger hover:text-white'
            : 'border-line-strong bg-surface text-ink hover:bg-surface-sunken',
        )}
      >
        {label}
      </button>
    ) : null;

  const secondsLeft = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const consentTo = [sentTo.mobile ? `mobile ${sentTo.mobile}` : null, sentTo.email ? `email ${sentTo.email}` : null].filter(Boolean).join(' and ');
  const pauseMonths = Number(fields['months'] ?? 1);

  const footer =
    step === 'details' ? (
      <div className="flex justify-end gap-2">
        <button type="button" className={Secondary} onClick={close} disabled={pending}>
          {action === 'sip_cancel' ? 'Back' : 'Cancel'}
        </button>
        <button type="button" className={action === 'sip_cancel' ? Danger : Primary} disabled={!detailsValid || pending} onClick={sendCode}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Continue to consent
        </button>
      </div>
    ) : step === 'otp' ? (
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className={Secondary}
          disabled={pending}
          onClick={() => {
            setStep('details');
            setError(null);
          }}
        >
          Back
        </button>
        <button type="button" className={Primary} disabled={otp.length !== 6 || pending} onClick={confirm}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Verify &amp; submit
        </button>
      </div>
    ) : (
      <div className="flex justify-end">
        <button type="button" className={Primary} onClick={close}>
          Done
        </button>
      </div>
    );

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {button('sip_modify', 'Modify SIP', 'plain', live && !paused)}
        {button(paused ? 'sip_resume' : 'sip_pause', paused ? 'Resume SIP' : 'Pause SIP', 'plain', live)}
        {button('redeem', 'Redeem', 'plain', !!sip.folio)}
        {button('sip_cancel', 'Cancel SIP', 'danger', live)}
      </div>

      <Modal
        open={action !== null}
        title={step === 'otp' ? 'Investor consent required' : step === 'done' ? 'Done' : action ? Titles[action] : ''}
        eyebrow={step === 'details' ? 'Step 1 of 2 · Details' : step === 'otp' ? 'Step 2 of 2 · Investor consent' : undefined}
        onClose={close}
        footer={footer}
      >
        <div className="space-y-4 text-[13.5px]">
          {step === 'details' && action === 'sip_modify' ? (
            <>
              <Label text="New SIP amount">
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted">₹</span>
                  <input
                    type="number"
                    min={100}
                    step={1}
                    inputMode="numeric"
                    autoFocus
                    className={cn(Control, 'tabular pl-7')}
                    value={String(fields['amount'] ?? '')}
                    onChange={(e) => set('amount', e.target.value)}
                  />
                </div>
              </Label>
              <Label text="SIP date">
                <select className={Control} value={String(fields['day'] ?? 5)} onChange={(e) => set('day', Number(e.target.value))}>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {ordinal(d)} of month
                    </option>
                  ))}
                </select>
              </Label>
              <Label text="Effective from">
                <select className={Control} disabled value="next">
                  <option value="next">Next instalment</option>
                </select>
              </Label>
              <Summary
                rows={[
                  ['Current', `${inr(sip.amount)} on the ${sip.sipDay ? ordinal(sip.sipDay) : '—'}`],
                  ['New', `${Number.isFinite(newAmount) && newAmount > 0 ? inr(newAmount) : '—'} on the ${newDay ? ordinal(newDay) : '—'}`],
                ]}
              />
              {overMandate ? (
                <p className="text-[12.5px] text-danger">More than the AutoPay limit of {inr(mandateMax)}. The investor needs a bigger mandate first.</p>
              ) : !modifyChanged ? (
                <p className="text-[12.5px] text-ink-muted">Change the amount or the date to continue.</p>
              ) : (
                <p className="text-[12.5px] text-ink-muted">
                  FP can&apos;t edit a running SIP, so this registers a new SIP on the same folio and AutoPay and cancels this one.
                </p>
              )}
            </>
          ) : null}

          {step === 'details' && action === 'sip_pause' ? (
            <>
              <Label text="Pause for">
                <select className={Control} value={String(pauseMonths)} onChange={(e) => set('months', Number(e.target.value))}>
                  <option value={1}>1 instalment</option>
                  <option value={2}>2 instalments (the most allowed)</option>
                </select>
              </Label>
              <Label text="Reason">
                <select className={Control} value={String(fields['reason'])} onChange={(e) => set('reason', e.target.value)}>
                  {PauseReasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Label>
              <Summary
                rows={[
                  ['Last instalment before pause', lastPaid ? dateOf(lastPaid) : 'None yet'],
                  [
                    'SIP resumes on',
                    monthly && sip.nextInstallmentDate ? dateOf(addMonths(sip.nextInstallmentDate, pauseMonths)) : `After ${pauseMonths} skipped`,
                  ],
                ]}
              />
              <p className="text-[12.5px] text-ink-muted">No instalments are debited while the SIP is paused.</p>
            </>
          ) : null}

          {step === 'details' && action === 'sip_resume' ? (
            <>
              <Summary
                rows={[
                  ['Paused', sip.pause ? `${dateOf(sip.pause.from)} to ${dateOf(sip.pause.to)}` : '—'],
                  ['Next debit', dateOf(sip.nextInstallmentDate)],
                ]}
              />
              <p className="text-[12.5px] text-ink-muted">The skipped instalments are put back; the SIP debits again from its next date.</p>
            </>
          ) : null}

          {step === 'details' && action === 'redeem' ? (
            <>
              <div className="flex gap-5">
                {(
                  [
                    [false, 'Amount'],
                    [true, 'All units'],
                  ] as const
                ).map(([all, label]) => (
                  <label key={label} className="flex items-center gap-2 text-[13.5px] text-ink">
                    <input type="radio" name="redeem-kind" className="accent-brand" checked={fields['all'] === all} onChange={() => set('all', all)} />
                    {label}
                  </label>
                ))}
              </div>
              {fields['all'] === true ? null : (
                <Label text="Redemption amount">
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted">₹</span>
                    <input
                      type="number"
                      min={100}
                      step={1}
                      inputMode="numeric"
                      autoFocus
                      className={cn(Control, 'tabular pl-7')}
                      value={String(fields['amount'] ?? '')}
                      onChange={(e) => set('amount', e.target.value)}
                    />
                  </div>
                </Label>
              )}
              <Label text="Credit to bank account">
                <select className={Control} disabled value="bank">
                  <option value="bank">{sip.bank ? `${sip.bank.bankName ?? 'Bank'} · ${sip.bank.accountMasked}` : "The folio's registered bank"}</option>
                </select>
              </Label>
              <Summary
                rows={[
                  ['Available units', sip.holding?.units ?? '—'],
                  ['Current value', inr(sip.holding?.current)],
                  ['Exit load', 'As per scheme, if applicable'],
                  ['Estimated credit by', dateOf(workingDaysFromToday(3))],
                ]}
              />
              {overHolding ? <p className="text-[12.5px] text-danger">More than the {inr(redeemable)} that can be redeemed now.</p> : null}
              <p className="text-[12.5px] text-ink-muted">
                Redeeming from a SIP scheme does not cancel the SIP. The money goes to the bank account registered on folio {sip.folio}.
              </p>
            </>
          ) : null}

          {step === 'details' && action === 'sip_cancel' ? (
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
              <Label text="Remarks">
                <textarea
                  rows={3}
                  maxLength={500}
                  className={cn(Control, 'h-auto py-2')}
                  value={String(fields['remarks'] ?? '')}
                  onChange={(e) => set('remarks', e.target.value)}
                />
              </Label>
              <p className="rounded-md border border-danger/30 bg-danger-soft px-3.5 py-3 text-[13px] text-danger">
                Cancelling stops all future instalments of this SIP. This cannot be undone.
                {sip.mandate ? ` AutoPay mandate ${sip.mandate.id} stays for the investor's other SIPs.` : ''} Units already bought stay invested.
              </p>
            </>
          ) : null}

          {step === 'otp' && action ? (
            <>
              <p className="text-[13px] text-ink-soft">
                Action: <span className="font-semibold text-ink">{Titles[action]}</span> · SIP {sip.reference}
              </p>
              <p className="text-[13px] text-ink-soft">
                A 6-digit OTP was sent to the investor&apos;s registered {consentTo || 'mobile and email'}. Ask the investor to share it. The action runs
                only after it is verified.
              </p>
              <OtpBoxes value={otp} onChange={setOtp} disabled={pending} />
              <div className="flex items-center justify-between text-[13px]">
                <span className="tabular text-ink-muted">{secondsLeft ? `Resend OTP in ${clock(secondsLeft)}` : 'Didn’t get it?'}</span>
                <button
                  type="button"
                  className="font-medium text-brand hover:underline disabled:text-ink-muted disabled:no-underline"
                  disabled={pending || secondsLeft > 0}
                  onClick={sendCode}
                >
                  Resend OTP
                </button>
              </div>
              <p className="text-[12px] text-ink-muted">The consent is logged with time, device and your admin ID.</p>
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
      </Modal>
    </>
  );
}

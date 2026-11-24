'use client';

import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { SidePanel } from '@/components/ui/side-panel';
import { refreshOrder, retryRedemption, sendRetryOtp } from '@/features/transactions/actions';
import type { TransactionDetail } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

const Primary = 'inline-flex h-9.5 items-center justify-center gap-2 rounded-md bg-brand px-4 text-[13.5px] font-medium text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50';
const Secondary = 'inline-flex h-9.5 items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-4 text-[13.5px] font-medium text-ink hover:bg-surface-sunken disabled:opacity-60';

/**
 * Retry. In progress: asks FP for the latest state. A failed redemption: placed again for the investor with their
 * OTP. A failed purchase can't be retried by staff (the investor pays), so the button says why.
 */
export function TransactionRetry({ detail, canAct }: { detail: TransactionDetail; canAct: boolean }): React.JSX.Element {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'intro' | 'otp' | 'done'>('intro');
  const [otp, setOtp] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [done, setDone] = useState<{ orderRef: string | null; orderId: string | null } | null>(null);
  const id = detail.order.id;

  useEffect(() => {
    if (step !== 'otp') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [step]);

  const disabled = detail.retry.kind === 'none' || (detail.retry.kind === 'redeem' && !canAct);
  const title =
    detail.retry.kind === 'none' ? detail.retry.reason ?? undefined
      : detail.retry.kind === 'redeem' && !canAct ? 'Needs the "Pause, resume, change or cancel SIPs" permission.'
        : detail.retry.kind === 'refresh' ? 'Ask FP for the latest state of this order.'
          : 'Place this redemption again, with the investor’s OTP.';

  const onRetry = (): void => {
    setMessage(null);
    if (detail.retry.kind === 'refresh') {
      start(async () => {
        const r = await refreshOrder(id);
        if (r.error) setMessage({ tone: 'error', text: r.error });
        else {
          setMessage({ tone: 'ok', text: 'Checked with FP: the latest state is shown.' });
          router.refresh();
        }
      });
      return;
    }
    setStep('intro');
    setOtp('');
    setDone(null);
    setOpen(true);
  };

  const sendCode = (): void => {
    setMessage(null);
    start(async () => {
      const r = await sendRetryOtp(id);
      if (!r.ok) return setMessage({ tone: 'error', text: r.error });
      setSentTo(r.sentTo);
      setResendAt(Date.now() + r.resendIn * 1000);
      setStep('otp');
    });
  };
  const confirm = (): void => {
    setMessage(null);
    start(async () => {
      const r = await retryRedemption(id, otp.trim());
      if (!r.ok) {
        setMessage({ tone: 'error', text: r.error });
        if (r.otpProblem) setOtp('');
        return;
      }
      setDone({ orderRef: r.orderRef, orderId: r.orderId });
      setStep('done');
    });
  };
  const close = (): void => {
    setOpen(false);
    setMessage(null);
    if (done?.orderId) router.push(`/transactions/${done.orderId}`);
    else router.refresh();
  };

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <button type="button" className={Primary} disabled={disabled || pending} title={title} onClick={onRetry}>
          {pending && !open ? <Loader2 className="size-4 animate-spin" /> : null}
          Retry
        </button>
        {message && !open ? <p className={cn('max-w-[280px] text-right text-[12px]', message.tone === 'ok' ? 'text-success' : 'text-danger')}>{message.text}</p> : null}
        {detail.retry.kind === 'none' && detail.order.state === 'FAILED' ? <p className="max-w-[280px] text-right text-[12px] text-ink-muted">{detail.retry.reason}</p> : null}
      </div>

      <SidePanel
        open={open}
        title="Retry redemption"
        subtitle={`${detail.order.scheme} · ${detail.order.investor.name ?? 'Investor'}`}
        onClose={close}
        footer={
          step === 'intro' ? (
            <div className="flex justify-end gap-2">
              <button type="button" className={Secondary} onClick={close}>Close</button>
              <button type="button" className={Primary} disabled={pending} onClick={sendCode}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                Send OTP to investor
              </button>
            </div>
          ) : step === 'otp' ? (
            <div className="flex justify-end gap-2">
              <button type="button" className={Secondary} disabled={pending} onClick={() => setStep('intro')}>Back</button>
              <button type="button" className={Primary} disabled={!/^\d{6}$/.test(otp.trim()) || pending} onClick={confirm}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                Confirm redemption
              </button>
            </div>
          ) : (
            <div className="flex justify-end">
              <button type="button" className={Primary} onClick={close}>Done</button>
            </div>
          )
        }
      >
        <div className="space-y-4 text-[13.5px]">
          {step === 'intro' ? (
            <>
              <p className="text-ink-soft">
                Places the same redemption again:{' '}
                <span className="font-medium text-ink">{detail.order.allUnits ? 'all units' : `₹${Number(detail.order.amount).toLocaleString('en-IN')}`}</span> from folio{' '}
                <span className="tabular font-medium text-ink">{detail.order.folio}</span>, paid to the investor&apos;s bank account.
              </p>
              <div className="flex gap-2 rounded-md bg-surface-sunken p-3 text-[12.5px] text-ink-soft">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
                <span>RiSips sends the investor a one-time code. Ask them to read it to you; nothing is placed without it. They get an email once it&apos;s placed.</span>
              </div>
            </>
          ) : null}
          {step === 'otp' ? (
            <>
              <p className="text-ink-soft">
                Code sent to <span className="font-medium text-ink">{sentTo}</span>. It works for 5 minutes.
              </p>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] text-ink-soft">Code the investor read out</span>
                <input
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className="tabular h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-center text-[18px] tracking-[0.4em] text-ink focus:border-brand focus:outline-none"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </label>
              <button type="button" className="text-[13px] font-medium text-brand disabled:text-ink-muted" disabled={pending || now < resendAt} onClick={sendCode}>
                {now < resendAt ? `Resend code in ${Math.ceil((resendAt - now) / 1000)} s` : 'Resend code'}
              </button>
            </>
          ) : null}
          {step === 'done' ? (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-[15px] font-semibold text-success">
                <CheckCircle2 className="size-5" /> Redemption placed again
              </p>
              {done?.orderRef ? (
                <p className="text-ink-soft">
                  New order <span className="tabular font-medium text-ink">{done.orderRef}</span> is with the fund house.
                </p>
              ) : null}
            </div>
          ) : null}
          {message && open ? <p className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">{message.text}</p> : null}
        </div>
      </SidePanel>
    </>
  );
}

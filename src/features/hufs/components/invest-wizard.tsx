'use client';

import { ArrowLeft, Check, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Field, SelectInput, TextInput } from '@/components/ui/field';
import { cutoffText, fundName } from '@/features/hufs/components/fund-explorer';
import { CopyLink } from '@/features/hufs/components/invest-forms';
import { placePurchase, registerSip, type InvestState } from '@/features/hufs/invest-actions';
import type { HufInvestmentsView, HufScheme } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';

const StepNames = ['Choose a fund', 'Amount', 'Review', 'Karta confirms'] as const;

/** Where an investment is: choosing the fund, entering it, reviewing it, then waiting on the karta. */
export function InvestSteps({ current }: { current: 1 | 2 | 3 | 4 }): React.JSX.Element {
  return (
    <ol className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-2" aria-label="Steps">
      {StepNames.map((name, i) => {
        const n = i + 1;
        const state = n < current ? 'done' : n === current ? 'now' : 'next';
        return (
          <li key={name} className="flex items-center gap-2" aria-current={state === 'now' ? 'step' : undefined}>
            <span
              className={cn(
                'flex size-6 items-center justify-center rounded-full text-[12px] font-bold',
                state === 'done' && 'bg-success text-white',
                state === 'now' && 'bg-brand text-white ring-4 ring-brand/15',
                state === 'next' && 'bg-surface-sunken text-ink-muted',
              )}
            >
              {state === 'done' ? <Check className="size-3.5" /> : n}
            </span>
            <span className={cn('text-[13px]', state === 'now' ? 'font-semibold text-ink' : 'text-ink-muted')}>{name}</span>
            {n < StepNames.length ? <span className="mx-1 hidden h-px w-8 bg-line-strong sm:block" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

const rupees = (n: number | null | undefined) => (n === null || n === undefined || !Number.isFinite(n) ? '—' : `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
const DayMs = 86_400_000;
const istToday = () => new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);
const plusDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * DayMs).toISOString().slice(0, 10);
const plusMonths = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
};
const longDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const monthYear = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** The next dates a SIP can start on: on the scheme's SIP days, far enough out for NSE. */
function startDates(rule: NonNullable<HufScheme['sipMonthly']>, count = 8): string[] {
  const out: string[] = [];
  const from = plusDays(istToday(), Math.max(rule.minGapDays ?? 0, 7));
  for (let i = 0; out.length < count && i < 400; i++) {
    const d = plusDays(from, i);
    if (!rule.dates.length || rule.dates.includes(Number(d.slice(8, 10)))) out.push(d);
  }
  return out;
}

function Submit({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-[13.5px] font-semibold text-white hover:bg-brand-strong disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {pending ? 'Sending to NSE…' : children}
    </button>
  );
}

function ReviewRow({ label, value, strong = false }: { label: string; value: React.ReactNode; strong?: boolean }): React.JSX.Element {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-[13px] text-ink-muted">{label}</dt>
      <dd className={cn('text-right text-[13px] text-ink', strong ? 'text-[15px] font-semibold' : 'font-medium')}>{value}</dd>
    </div>
  );
}

const Initial: InvestState = { error: null };

type WizardProps = {
  hufId: string;
  hufName: string;
  scheme: HufScheme;
  kind: 'lumpsum' | 'sip';
  folios: string[];
  mandates: HufInvestmentsView['approvedMandates'];
  live: boolean;
  mandateHref: string;
};

/**
 * Steps 2 to 4 of an investment: the amount (and for a SIP its dates and mandate), a review of exactly what goes to
 * NSE, then NSE's link for the karta. Nothing reaches NSE before the review is confirmed.
 */
export function InvestWizard(props: WizardProps): React.JSX.Element {
  const { hufId, hufName, scheme, kind, folios, mandates, live, mandateHref } = props;
  const [purchaseState, purchase] = useActionState(placePurchase, Initial);
  const [sipState, sip] = useActionState(registerSip, Initial);
  const state = kind === 'lumpsum' ? purchaseState : sipState;
  const [step, setStep] = useState<'details' | 'review'>('details');
  const [amount, setAmount] = useState('');
  const [folio, setFolio] = useState(folios[0] ?? '');
  const rule = scheme.sipMonthly;
  const dates = rule ? startDates(rule) : [];
  const [startDate, setStartDate] = useState(dates[0] ?? '');
  const [installments, setInstallments] = useState('60');
  const [mandateId, setMandateId] = useState(mandates[0]?.mandateId ?? '');
  const [problem, setProblem] = useState<string | null>(null);

  const n = Number(amount.replace(/,/g, ''));
  const count = Number(installments);
  const mandate = mandates.find((m) => m.mandateId === mandateId) ?? null;
  const min = kind === 'sip' ? rule?.minAmount ?? null : folio ? scheme.minAdditional : scheme.minFresh;
  const multiple = kind === 'sip' ? rule?.multiplier ?? null : scheme.multiplier;
  const lastInstalment = startDate && count > 0 ? plusMonths(startDate, count - 1) : null;

  const check = (): string | null => {
    if (!(n > 0)) return 'Enter the amount.';
    if (Math.round(n * 100) !== n * 100) return 'Enter the amount in rupees and paise at most.';
    if (min && n < min) return `The minimum ${kind === 'sip' ? 'monthly SIP' : folio ? 'additional purchase' : 'first purchase'} is ${rupees(min)}.`;
    if (multiple && multiple > 1 && n % multiple !== 0) return `The amount must be a multiple of ${rupees(multiple)}.`;
    if (kind === 'sip' && rule) {
      if (rule.maxAmount && n > rule.maxAmount) return `The maximum SIP is ${rupees(rule.maxAmount)}.`;
      if (!mandate) return 'Choose an approved mandate.';
      if (mandate.amount && n > mandate.amount) return `The mandate allows at most ${rupees(mandate.amount)} a debit.`;
      if (!startDate) return 'Choose when the SIP starts.';
      if (!Number.isInteger(count) || count < 1) return 'Enter the number of instalments.';
      if (rule.minInstallments && count < rule.minInstallments) return `At least ${rule.minInstallments} instalments.`;
      if (rule.maxInstallments && count > rule.maxInstallments) return `At most ${rule.maxInstallments} instalments.`;
      if (mandate.endDate && lastInstalment && lastInstalment > mandate.endDate) return 'The SIP would run past its mandate. Use fewer instalments.';
    }
    return null;
  };

  const backHref = `/onboarding/hufs/${hufId}?tab=portfolio`;

  // Step 4: placed; the karta takes it from here.
  if (state.done) {
    return (
      <>
        <InvestSteps current={4} />
        <div className="max-w-2xl rounded-xl border border-success/25 bg-surface p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-success" />
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <h2 className="text-[16px] font-semibold text-ink">{kind === 'lumpsum' ? 'Order placed on NSE' : 'SIP registered on NSE'}</h2>
                <p className="mt-1 text-[13px] text-ink-soft">{state.done}</p>
              </div>
              <ol className="list-decimal space-y-1 pl-5 text-[13px] text-ink-soft">
                {kind === 'lumpsum' ? (
                  <>
                    <li>NSE emails and texts the karta a link. They confirm the order with an OTP.</li>
                    <li>They pay {rupees(n)} from {hufName}&apos;s own bank account on NSE&apos;s page{scheme.cutoff ? `, before ${cutoffText(scheme.cutoff)} for today's NAV` : ''}.</li>
                    <li>The registrar allots units, usually the next working day. They show on the HUF&apos;s portfolio after a refresh.</li>
                  </>
                ) : (
                  <>
                    <li>NSE emails and texts the karta a link. They approve the SIP with an OTP.</li>
                    <li>From {startDate ? longDate(startDate) : 'the start date'}, {rupees(n)} is debited each month through the mandate.</li>
                    <li>Each instalment&apos;s units show on the HUF&apos;s portfolio after a refresh.</li>
                  </>
                )}
              </ol>
              {state.link ? (
                <div className="space-y-1.5">
                  <p className="text-[12.5px] font-medium text-ink">NSE&apos;s link for the karta, if they ask for it again:</p>
                  <CopyLink url={state.link} />
                </div>
              ) : (
                <p className="text-[12.5px] text-ink-muted">NSE hasn&apos;t issued the link yet. Fetch it later from the HUF&apos;s Transactions tab.</p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <Link href={`/onboarding/hufs/${hufId}?tab=transactions`} className="inline-flex h-9 items-center rounded-lg bg-brand px-4 text-[13px] font-semibold text-white hover:bg-brand-strong">
                  See it in Transactions
                </Link>
                <Link href={`/onboarding/hufs/${hufId}/invest`} className="inline-flex h-9 items-center rounded-lg border border-line-strong bg-surface px-4 text-[13px] font-medium text-ink hover:bg-surface-sunken">
                  Invest in another fund
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (kind === 'sip' && !rule) return <p className="text-[13px] text-ink-muted">This fund doesn&apos;t take monthly SIPs.</p>;
  if (kind === 'sip' && !mandates.length) {
    return (
      <>
        <InvestSteps current={2} />
        <div className="max-w-2xl rounded-xl border border-warn/25 bg-warn-soft p-5 text-[13px] text-warn">
          <p className="font-semibold">A SIP needs an approved eNACH mandate first.</p>
          <p className="mt-1">
            The mandate lets the HUF&apos;s bank pay each instalment. Register one, have the karta approve it with their bank, then come back here.
          </p>
          <Link href={mandateHref} className="mt-3 inline-flex h-9 items-center rounded-lg bg-brand px-4 font-semibold text-white hover:bg-brand-strong">
            Set up a mandate
          </Link>
        </div>
      </>
    );
  }

  if (step === 'review') {
    const approxUnits = scheme.nav && n ? n / scheme.nav : null;
    return (
      <>
        <InvestSteps current={3} />
        <form action={kind === 'lumpsum' ? purchase : sip} className="max-w-2xl space-y-4">
          <input type="hidden" name="id" value={hufId} />
          <input type="hidden" name="schemeCode" value={scheme.schemeCode} />
          <input type="hidden" name="amount" value={String(n)} />
          {kind === 'lumpsum' ? (
            <input type="hidden" name="folio" value={folio} />
          ) : (
            <>
              <input type="hidden" name="startDate" value={startDate} />
              <input type="hidden" name="installments" value={String(count)} />
              <input type="hidden" name="mandateId" value={mandateId} />
            </>
          )}
          <div className="rounded-xl border border-line bg-surface">
            <div className="border-b border-line px-5 py-3.5">
              <p className="text-[11.5px] font-semibold tracking-[0.04em] text-ink-muted uppercase">{kind === 'lumpsum' ? 'Lumpsum purchase' : 'Monthly SIP'}</p>
              <p className="mt-0.5 text-[14px] font-semibold text-ink">{fundName(scheme)}</p>
            </div>
            <dl className="divide-y divide-line px-5">
              <ReviewRow label="For" value={hufName} />
              {kind === 'lumpsum' ? (
                <>
                  <ReviewRow label="Amount" value={rupees(n)} strong />
                  <ReviewRow label="Folio" value={folio ? `${folio} (additional purchase)` : 'A new folio (first purchase)'} />
                  <ReviewRow label="Units, roughly" value={approxUnits ? `${approxUnits.toLocaleString('en-IN', { maximumFractionDigits: 3 })} at today's NAV of ${rupees(scheme.nav)}` : '—'} />
                  <ReviewRow label="NAV applied" value={`The day the money reaches the fund${scheme.cutoff ? `; pay before ${cutoffText(scheme.cutoff)} for the same day` : ''}`} />
                </>
              ) : (
                <>
                  <ReviewRow label="Every month" value={rupees(n)} strong />
                  <ReviewRow label="First instalment" value={startDate ? longDate(startDate) : '—'} />
                  <ReviewRow label="Instalments" value={`${count}, the last in ${lastInstalment ? monthYear(lastInstalment) : '—'}`} />
                  <ReviewRow label="Total over the SIP" value={rupees(n * count)} />
                  <ReviewRow label="Paid through" value={mandate ? `Mandate ${mandate.mandateId}${mandate.bankName ? `, ${mandate.bankName}` : ''} (up to ${rupees(mandate.amount)})` : '—'} />
                </>
              )}
              <ReviewRow label="Exit load" value={scheme.exitLoad ?? '—'} />
              <ReviewRow label="On" value={live ? "NSE's live account" : "NSE's test (UAT) account"} />
            </dl>
          </div>
          <label className="flex items-start gap-2.5 rounded-lg border border-line bg-surface-sunken p-3.5 text-[13px] text-ink-soft">
            <input type="checkbox" name="confirm" required className="mt-0.5 size-4 accent-[var(--color-brand)]" />
            <span>
              {kind === 'lumpsum' ? 'Place this order' : 'Register this SIP'} on NSE for {hufName}. NSE then sends the karta a link to{' '}
              {kind === 'lumpsum' ? 'confirm it with an OTP and pay from the HUF’s own bank account' : 'approve it with an OTP'}; nothing is debited until they do.
            </span>
          </label>
          {state.error ? <p role="alert" className="rounded-md border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">{state.error}</p> : null}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setStep('details')}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-4 text-[13.5px] font-medium text-ink hover:bg-surface-sunken"
            >
              <ArrowLeft className="size-4" />
              Change
            </button>
            <Submit>{kind === 'lumpsum' ? 'Place order on NSE' : 'Register SIP on NSE'}</Submit>
          </div>
        </form>
      </>
    );
  }

  const quick = kind === 'lumpsum' ? [5000, 10000, 25000, 50000, 100000] : [1000, 2500, 5000, 10000, 25000];
  return (
    <>
      <InvestSteps current={2} />
      <form
        className="max-w-2xl space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          const p = check();
          setProblem(p);
          if (!p) setStep('review');
        }}
      >
        <div className="rounded-xl border border-line bg-surface p-5">
          <Field
            label={kind === 'lumpsum' ? 'How much to invest' : 'How much each month'}
            hint={`Minimum ${rupees(min)}${multiple && multiple > 1 ? `, in multiples of ${rupees(multiple)}` : ''}${kind === 'sip' && rule?.maxAmount && rule.maxAmount < 1e7 ? `, at most ${rupees(rule.maxAmount)}` : ''}`}
            required
          >
            <span className="relative block">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[18px] font-semibold text-ink-muted">₹</span>
              <TextInput
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
                inputMode="decimal"
                autoFocus
                placeholder={String(min ?? '')}
                className="h-12 pl-8 text-[18px] font-semibold"
              />
            </span>
          </Field>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {quick.filter((q) => !min || q >= min).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setAmount(String(q))}
                className={cn(
                  'rounded-full border px-3 py-1 text-[12.5px] font-medium',
                  n === q ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line-strong text-ink-soft hover:bg-surface-sunken',
                )}
              >
                {rupees(q)}
              </button>
            ))}
          </div>
        </div>

        {kind === 'lumpsum' ? (
          <div className="rounded-xl border border-line bg-surface p-5">
            <Field label="Folio" hint={folios.length ? 'Adding to a folio the HUF already has keeps its units together.' : 'The HUF has no folio in this fund yet; NSE opens one.'}>
              <SelectInput value={folio} onChange={(e) => setFolio(e.target.value)}>
                {folios.map((f) => (
                  <option key={f} value={f}>
                    {f} (additional purchase)
                  </option>
                ))}
                <option value="">A new folio (first purchase)</option>
              </SelectInput>
            </Field>
          </div>
        ) : rule ? (
          <div className="grid gap-4 rounded-xl border border-line bg-surface p-5 sm:grid-cols-2">
            <Field label="First instalment" hint={`This fund takes SIPs on day ${rule.dates.join(', ') || 'any'} of the month`} required>
              <SelectInput value={startDate} onChange={(e) => setStartDate(e.target.value)}>
                {dates.map((d) => (
                  <option key={d} value={d}>
                    {longDate(d)}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Instalments" hint={`${rule.minInstallments ?? 1} to ${rule.maxInstallments ?? 999}${lastInstalment ? `; the last in ${monthYear(lastInstalment)}` : ''}`} required>
              <TextInput value={installments} onChange={(e) => setInstallments(e.target.value.replace(/\D/g, ''))} inputMode="numeric" />
            </Field>
            <div className="flex flex-wrap gap-1.5 sm:col-span-2">
              {[12, 36, 60, 120].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setInstallments(String(m))}
                  className={cn(
                    'rounded-full border px-3 py-1 text-[12.5px] font-medium',
                    count === m ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line-strong text-ink-soft hover:bg-surface-sunken',
                  )}
                >
                  {m / 12} {m === 12 ? 'year' : 'years'}
                </button>
              ))}
            </div>
            <Field label="Mandate" className="sm:col-span-2" hint="Each instalment is debited through this approved eNACH mandate." required>
              <SelectInput value={mandateId} onChange={(e) => setMandateId(e.target.value)}>
                {mandates.map((m) => (
                  <option key={m.mandateId} value={m.mandateId}>
                    {m.mandateId} · up to {rupees(m.amount)}{m.bankName ? ` · ${m.bankName}` : ''}
                  </option>
                ))}
              </SelectInput>
            </Field>
            {n > 0 && count > 0 ? (
              <p className="text-[12.5px] text-ink-soft sm:col-span-2">
                {rupees(n)} a month for {count} months: <span className="font-semibold text-ink">{rupees(n * count)}</span> in all.
              </p>
            ) : null}
          </div>
        ) : null}

        {problem ? <p role="alert" className="text-[13px] text-danger">{problem}</p> : null}
        <button type="submit" className="inline-flex h-10 items-center rounded-lg bg-brand px-5 text-[13.5px] font-semibold text-white hover:bg-brand-strong">
          Review
        </button>
      </form>
    </>
  );
}

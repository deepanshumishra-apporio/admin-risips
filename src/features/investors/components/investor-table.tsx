'use client';

import { ChevronRight, Loader2, Send, Users, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { nudge } from '@/features/investors/actions';
import { stepOf } from '@/features/investors/stages';
import { KycLabel, NextStepLabel, StageLabel } from '@/features/investors/labels';
import type { InvestorListItem, NudgeResult } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatDate, formatInrString, initialsOf, timeAgo } from '@/utils/format';

const Steps = 5;

/** Days from today (India) to a yyyy-mm-dd date. */
function daysUntil(date: string): number {
  const today = Date.parse(new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10));
  return Math.round((Date.parse(date) - today) / 86_400_000);
}

/** What a nudge did, in one line. */
function summarise(result: NudgeResult): string {
  const parts = [`${result.sent} ${result.sent === 1 ? 'reminder' : 'reminders'} sent`];
  if (result.skippedRecent) parts.push(`${result.skippedRecent} already nudged this week`);
  if (result.skippedOptedOut) parts.push(`${result.skippedOptedOut} turned reminders off`);
  if (result.skippedInvested) parts.push(`${result.skippedInvested} already invested`);
  return parts.join(' · ');
}

function Progress({ investor }: { investor: InvestorListItem }): React.JSX.Element {
  const step = stepOf(investor.stage);
  const detail =
    investor.stage === 'KYC'
      ? investor.kycNextStep
        ? `KYC · ${NextStepLabel[investor.kycNextStep].toLowerCase()}`
        : `KYC · ${KycLabel[investor.kycStatus].toLowerCase()}`
      : StageLabel[investor.stage];
  return (
    <div className="min-w-[132px]">
      <div className="flex gap-1" aria-label={`Step ${step} of ${Steps}`}>
        {Array.from({ length: Steps }, (_, index) => (
          <span key={index} className={cn('h-1.5 w-5 rounded-full', index < step ? 'bg-brand' : 'bg-line-strong')} />
        ))}
      </div>
      <span className="mt-1.5 block text-[12.5px] text-ink-soft">{detail}</span>
    </div>
  );
}

/**
 * The investor list. Rows open the investor's record; the boxes on the left
 * pick investors to nudge together, and a ready-to-invest row has its own
 * Nudge.
 */
export function InvestorTable({ investors, canNudge }: { investors: InvestorListItem[]; canNudge: boolean }): React.JSX.Element {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [, start] = useTransition();

  if (investors.length === 0) {
    return (
      <EmptyState
        icon={<Users className="size-5" />}
        title="No investors match"
        description="Try a different search, or clear the filters."
      />
    );
  }

  const nudgeable = investors.filter((investor) => investor.stage !== 'INVESTED').map((investor) => investor.id);
  const allPicked = nudgeable.length > 0 && nudgeable.every((id) => selected.includes(id));
  const toggle = (id: string): void =>
    setSelected((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));

  const send = (ids: string[]): void => {
    setMessage(null);
    setPendingIds(ids);
    start(async () => {
      const outcome = await nudge(ids);
      setPendingIds([]);
      if (outcome.error !== null) setMessage({ text: outcome.error, error: true });
      else {
        setMessage({ text: summarise(outcome.result), error: false });
        setSelected([]);
        router.refresh();
      }
    });
  };

  return (
    <>
      {canNudge && (selected.length > 0 || message) ? (
        <div
          className={cn(
            'flex flex-wrap items-center gap-3 border-y px-6 py-2.5 text-[13px]',
            message?.error ? 'border-danger/25 bg-danger-soft text-danger' : 'border-brand/20 bg-brand-soft text-brand-deep',
          )}
          role="status"
        >
          {selected.length > 0 ? (
            <>
              <span className="font-semibold">{selected.length} selected</span>
              <button
                type="button"
                onClick={() => send(selected)}
                disabled={pendingIds.length > 0}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 font-medium text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
              >
                {pendingIds.length > 1 ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                Nudge {selected.length}
              </button>
              <button type="button" onClick={() => setSelected([])} className="font-medium opacity-80 hover:opacity-100">
                Clear
              </button>
            </>
          ) : null}
          {message ? <span className="ml-auto">{message.text}</span> : null}
          {message ? (
            <button type="button" onClick={() => setMessage(null)} aria-label="Dismiss" className="opacity-70 hover:opacity-100">
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left">
          <thead>
            <tr className="border-y border-line bg-surface-sunken/60 text-[11.5px] font-semibold tracking-[0.06em] text-ink-muted uppercase">
              {canNudge ? (
                <th className="w-10 py-3 pl-6">
                  <input
                    type="checkbox"
                    aria-label="Select everyone who has not invested"
                    checked={allPicked}
                    disabled={nudgeable.length === 0}
                    onChange={() => setSelected(allPicked ? [] : nudgeable)}
                    className="size-3.5 accent-[var(--color-brand)]"
                  />
                </th>
              ) : null}
              <th className={cn('py-3 pr-4', canNudge ? 'pl-3' : 'pl-6')}>Investor</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Current value</th>
              <th className="px-4 py-3">SIPs</th>
              <th className="px-4 py-3">Next SIP</th>
              <th className="px-4 py-3">Last active</th>
              <th className="w-12 py-3 pr-6" aria-label="Open" />
            </tr>
          </thead>
          <tbody>
            {investors.map((investor) => {
              const name = investor.name ?? 'Unnamed investor';
              const value = Number(investor.currentValue);
              const invested = investor.stage === 'INVESTED' || value > 0;
              const due = investor.nextSipDate ? daysUntil(investor.nextSipDate) : null;
              const href = `/investors/${investor.id}`;
              const picked = selected.includes(investor.id);
              const nudging = pendingIds.length === 1 && pendingIds[0] === investor.id;
              return (
                <tr
                  key={investor.id}
                  className={cn('group border-b border-line transition-colors last:border-b-0', picked ? 'bg-brand-soft/40' : 'hover:bg-surface-sunken')}
                >
                  {canNudge ? (
                    <td className="py-4 pl-6 align-middle">
                      {investor.stage !== 'INVESTED' ? (
                        <input
                          type="checkbox"
                          aria-label={`Select ${name}`}
                          checked={picked}
                          onChange={() => toggle(investor.id)}
                          className="size-3.5 accent-[var(--color-brand)]"
                        />
                      ) : null}
                    </td>
                  ) : null}
                  <td className={cn('py-4 pr-4 align-middle', canNudge ? 'pl-3' : 'pl-6')}>
                    <Link href={href} className="flex items-center gap-3">
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#1e3a8a] text-[12.5px] font-semibold text-white">
                        {initialsOf(name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-semibold text-ink group-hover:text-brand">{name}</span>
                        <span className="block truncate text-[12.5px] text-ink-muted">
                          {investor.email ?? investor.phone}
                          {investor.pan ? <span className="tabular"> · {investor.pan}</span> : null}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <Progress investor={investor} />
                  </td>
                  <td className="tabular px-4 py-4 align-middle">
                    {invested ? (
                      <>
                        <span className="block text-[14px] font-semibold text-ink">{formatInrString(investor.currentValue)}</span>
                        {Number(investor.investedAmount) > 0 ? (
                          <span className="block text-[12px] text-ink-muted">{formatInrString(investor.investedAmount)} bought</span>
                        ) : null}
                      </>
                    ) : (
                      <span className="inline-flex rounded-md bg-warn-soft px-2.5 py-1 text-[12.5px] font-semibold whitespace-nowrap text-warn">
                        Hasn&apos;t invested yet
                      </span>
                    )}
                  </td>
                  <td className="tabular px-4 py-4 align-middle">
                    {investor.activeSips > 0 ? (
                      <>
                        <span className="block text-[14px] font-semibold text-ink">{investor.activeSips} active</span>
                        <span className="block text-[12px] text-ink-muted">{formatInrString(investor.sipMonthlyAmount, { compact: false })}/mo</span>
                      </>
                    ) : canNudge && investor.stage !== 'INVESTED' ? (
                      <button
                        type="button"
                        onClick={() => send([investor.id])}
                        disabled={pendingIds.length > 0}
                        className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-brand hover:text-brand-deep disabled:opacity-60"
                      >
                        Nudge
                        {nudging ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                      </button>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 align-middle text-[13.5px] text-ink">
                    {investor.nextSipDate && due !== null ? (
                      <>
                        {formatDate(investor.nextSipDate)}
                        <span className={cn('block text-[12px]', due <= 3 ? 'font-medium text-warn' : 'text-ink-muted')}>
                          {due < 0 ? 'overdue' : due === 0 ? 'today' : due === 1 ? 'tomorrow' : `in ${due} days`}
                        </span>
                      </>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 align-middle text-[13.5px] whitespace-nowrap text-ink-soft">{timeAgo(investor.lastActivityAt)}</td>
                  <td className="py-4 pr-6 align-middle">
                    <Link href={href} aria-label={`Open ${name}`} className="flex justify-end text-ink-muted group-hover:text-ink">
                      <ChevronRight className="size-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

import Link from 'next/link';

import { Badge, type BadgeTone } from '@/components/ui/badge';
import type { SipListItem, SipStatus } from '@/types/admin-api.types';
import { formatDate, formatInrString } from '@/utils/format';

export const SipStatusBadge: Record<SipStatus, { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: 'Active', tone: 'success' },
  PAUSED: { label: 'Paused', tone: 'warn' },
  BOUNCED: { label: 'Bounced', tone: 'danger' },
  AWAITING_PAYMENT: { label: 'Awaiting payment', tone: 'brand' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
  COMPLETED: { label: 'Completed', tone: 'neutral' },
  FAILED: { label: 'Failed', tone: 'danger' },
};

const frequencyLabel = (f: string): string => f.charAt(0).toUpperCase() + f.slice(1).replaceAll('_', ' ');
const shortId = (ref: string): string => (ref.length > 14 ? `${ref.slice(0, 12)}…` : ref);
const date = (d: string | null): string => (d ? formatDate(d) : '—');

/** One row per SIP. The SIP ID opens the SIP; the investor's name opens their record. */
export function SipTable({ sips }: { sips: SipListItem[] }): React.JSX.Element {
  const head = 'px-3 py-2.5 font-medium whitespace-nowrap';
  const cell = 'px-3 py-2.5 whitespace-nowrap';
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px] text-[13px]">
        <thead>
          <tr className="border-b border-line bg-surface-sunken text-left text-[12px] text-ink-muted">
            <th className={head}>SIP ID</th>
            <th className={head}>Investor</th>
            <th className={head}>Folio</th>
            <th className={head}>Scheme</th>
            <th className={`${head} text-right`}>SIP amount</th>
            <th className={head}>Frequency</th>
            <th className={head}>Start date</th>
            <th className={head}>Next instalment</th>
            <th className={head}>Instalments</th>
            <th className={head}>Status</th>
          </tr>
        </thead>
        <tbody>
          {sips.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-4 py-10 text-center text-ink-muted">
                No SIPs match these filters.
              </td>
            </tr>
          ) : (
            sips.map((sip) => {
              const href = sip.investor ? `/investors/${sip.investor.id}` : null;
              const detail = `/orders/sips/${sip.id}`;
              const status = SipStatusBadge[sip.status];
              return (
                <tr key={sip.id} className="border-b border-line last:border-b-0 hover:bg-surface-sunken/60">
                  <td className={`${cell} tabular`} title={sip.reference}>
                    <Link href={detail} className="font-medium text-brand underline-offset-2 hover:underline">
                      {shortId(sip.reference)}
                    </Link>
                  </td>
                  <td className={cell}>
                    {href ? (
                      <Link href={href} className="font-medium text-brand underline-offset-2 hover:underline">
                        {sip.investor?.name || 'No name yet'}
                      </Link>
                    ) : (
                      <span className="text-ink-muted">Unknown investor</span>
                    )}
                  </td>
                  <td className={`${cell} tabular text-ink-soft`}>{sip.folio ?? '—'}</td>
                  <td className="max-w-[260px] px-3 py-2.5">
                    <span className="block truncate text-ink" title={sip.scheme}>
                      {sip.scheme}
                    </span>
                    {sip.amc ? <span className="block text-[11.5px] text-ink-muted">{sip.amc}</span> : null}
                  </td>
                  <td className={`${cell} tabular text-right font-medium text-ink`}>{formatInrString(sip.amount, { compact: false })}</td>
                  <td className={`${cell} text-ink-soft`}>{frequencyLabel(sip.frequency)}</td>
                  <td className={`${cell} text-ink-soft`}>{date(sip.startDate)}</td>
                  <td className={`${cell} text-ink-soft`}>{date(sip.nextInstallmentDate)}</td>
                  <td className={`${cell} tabular text-ink-soft`}>
                    {sip.installmentsPaid} / {sip.installmentsTotal ?? '∞'}
                  </td>
                  <td className={cell}>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

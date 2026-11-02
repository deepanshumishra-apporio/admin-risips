import type { Metadata } from 'next';

import { BrandLogo } from '@/components/layout/brand-mark';
import { ConsentForm } from '@/features/hufs/components/consent-form';
import { ApiError } from '@/lib/api/errors';
import { getHufConsent } from '@/lib/api/hufs';
import type { HufConsentView } from '@/types/admin-api.types';
import { formatDate } from '@/utils/format';

export const metadata: Metadata = { title: 'HUF consent · RiSips', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

function Row({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2 text-[13.5px] last:border-b-0">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

/**
 * The page a karta opens from the link staff send them. No sign-in: the token
 * in the link is the key. It shows the HUF's details masked, and records the
 * karta's agreement (with their own IP and time) for NSE.
 */
export default async function HufConsentPage({ params }: { params: Promise<{ token: string }> }): Promise<React.JSX.Element> {
  const { token } = await params;
  let view: HufConsentView | null = null;
  let problem: string | null = null;
  try {
    view = await getHufConsent(token);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    problem = error.message;
  }

  return (
    <main className="min-h-screen bg-surface-sunken px-4 py-10 text-ink">
      <div className="mx-auto max-w-xl">
        <BrandLogo height={32} className="mb-6" />
        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
          {!view ? (
            <>
              <h1 className="text-[20px] font-semibold">This link can&apos;t be used</h1>
              <p className="mt-2 text-[14px] text-ink-soft">{problem ?? 'Ask RiSips for a new one.'}</p>
            </>
          ) : (
            <>
              <h1 className="text-[20px] font-semibold">Confirm your HUF&apos;s registration</h1>
              <p className="mt-1.5 text-[14px] text-ink-soft">
                RiSips will register this Hindu Undivided Family with NSE Invest. Please check the details and give your consent.
              </p>
              <dl className="my-5">
                <Row label="HUF" value={view.huf.name} />
                <Row label="HUF PAN" value={view.huf.pan} />
                <Row label="Formed on" value={formatDate(view.huf.formedOn)} />
                <Row label="Karta" value={`${view.huf.kartaName} · ${view.huf.kartaPan}`} />
                <Row label="Email for NSE links" value={view.huf.email} />
                <Row label="Mobile for OTPs" value={view.huf.mobile} />
                <Row label="Bank account" value={`${view.huf.bank.holder} · ${view.huf.bank.accountNo} · ${view.huf.bank.ifsc}`} />
                <Row label="Address" value={view.huf.address} />
                {view.huf.coparceners.length ? (
                  <Row label="Co-parceners" value={view.huf.coparceners.map((m) => `${m.name} (${m.relationship.toLowerCase()})`).join(', ')} />
                ) : null}
              </dl>
              <p className="mb-4 text-[12.5px] text-ink-muted">Something wrong? Don&apos;t agree. Tell RiSips, and they will send you a corrected link.</p>
              <ConsentForm token={token} view={view} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

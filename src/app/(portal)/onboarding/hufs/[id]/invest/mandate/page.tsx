import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { CopyLink, MandateForm, RefreshInvestments, RequestLink } from '@/features/hufs/components/invest-forms';
import { inr, planTone, sentence } from '@/features/hufs/portfolio';
import { ApiError } from '@/lib/api/errors';
import { getHuf, getHufInvestments } from '@/lib/api/hufs';
import { hasPermission } from '@/lib/auth/session';
import type { HufDetail, HufInvestmentsView } from '@/types/admin-api.types';

export const metadata: Metadata = { title: 'SIP mandate · RiSips Admin' };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * The HUF's eNACH mandates: what NSE has, and registering a new one. A SIP debits through an approved mandate,
 * which the karta approves with their bank on NSE's link.
 */
export default async function HufMandatePage({ params, searchParams }: Props): Promise<React.JSX.Element> {
  const { id } = await params;
  if (!(await hasPermission('hufs.manage'))) {
    return (
      <>
        <PageHeader title="SIP mandate" />
        <NoAccess what="HUF onboarding" />
      </>
    );
  }
  let huf: HufDetail;
  let view: HufInvestmentsView;
  try {
    [huf, view] = await Promise.all([getHuf(id), getHufInvestments(id)]);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }
  const fund = (await searchParams)['fund'];
  const back = typeof fund === 'string' && fund ? `/onboarding/hufs/${id}/invest/${encodeURIComponent(fund)}?type=sip` : `/onboarding/hufs/${id}/invest`;
  const mandates = view.investments?.mandates ?? [];
  const asked = view.requests.filter((r) => r.kind === 'MANDATE').slice(0, 5);

  return (
    <>
      <Link href={back} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-3.5" />
        Back to the SIP
      </Link>
      <PageHeader
        title="SIP mandate"
        description={`An eNACH mandate lets ${huf.hufName}'s bank pay each SIP instalment. Register it here; the karta approves it with their bank on NSE's link; then any SIP can use it.`}
      />
      {view.block ? (
        <p className="rounded-md border border-warn/25 bg-warn-soft px-4 py-2.5 text-[13px] text-warn">Can&apos;t set one up yet: {view.block}</p>
      ) : (
        <div className="grid max-w-5xl grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="The HUF's mandates" subtitle={view.readAt ? `As NSE had them at ${new Date(view.readAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}` : 'Not read from NSE yet'} />
            <CardBody className="space-y-4">
              {mandates.length ? (
                <ul className="divide-y divide-line rounded-lg border border-line">
                  {mandates.map((m) => (
                    <li key={m.mandateId} className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-3 text-[13px]">
                      <span className="min-w-0">
                        <span className="tabular block font-semibold text-ink">{m.mandateId}</span>
                        <span className="block text-[12px] text-ink-muted">
                          Up to {inr(m.amount)}{m.bankName ? ` · ${m.bankName}` : ''}{m.endDate ? ` · until ${m.endDate}` : ''}
                          {m.remark ? ` · ${m.remark}` : ''}
                        </span>
                      </span>
                      <Badge tone={planTone(m.status)}>{sentence(m.status)}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-ink-muted">No mandate on NSE yet.</p>
              )}
              <p className="text-[12.5px] text-ink-muted">Approved with the bank? Read NSE again and it shows as approved.</p>
              <RefreshInvestments hufId={id} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Register a new mandate" subtitle={`On ${huf.hufName}'s own bank account, as NSE has it`} />
            <CardBody className="space-y-4">
              <MandateForm hufId={id} />
              <p className="text-[12px] text-ink-muted">Some banks don&apos;t support eNACH (e.g. Jio Payments Bank, Nainital Bank).</p>
              {asked.length ? (
                <div className="space-y-3 border-t border-line pt-4">
                  <p className="text-[12.5px] font-semibold text-ink">Registered from here</p>
                  {asked.map((r) => (
                    <div key={r.id} className="space-y-1.5 text-[12.5px]">
                      <p className="text-ink-soft">
                        {r.nseId ?? r.id} · up to {inr(r.amount)} · {r.ok ? 'sent to the karta' : `refused: ${r.remark ?? r.status}`}
                      </p>
                      {r.link ? <CopyLink url={r.link} /> : r.ok ? <RequestLink hufId={id} requestId={r.id} /> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}

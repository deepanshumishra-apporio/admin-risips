import { ArrowLeft, CheckCircle2, Circle, ExternalLink, Pencil, XCircle } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import {
  ApproveAction, CancelAction, ConsentLinkAction, MarkActiveAction, RefreshAction, ResendAction,
} from '@/features/hufs/components/huf-actions';
import { HufEventLabel, HufStatusLabel, HufStatusTone, RegistrarLabel, RegistrarTone } from '@/features/hufs/labels';
import { ApiError } from '@/lib/api/errors';
import { getHuf, getHufOptions } from '@/lib/api/hufs';
import { hasPermission } from '@/lib/auth/session';
import type { HufDetail } from '@/types/admin-api.types';
import { formatDate, formatDateTime } from '@/utils/format';

export const metadata: Metadata = { title: 'HUF · RiSips Admin' };

type StepState = 'done' | 'failed' | 'todo';

function Step({ state, title, detail }: { state: StepState; title: string; detail?: string | null }): React.JSX.Element {
  const Icon = state === 'done' ? CheckCircle2 : state === 'failed' ? XCircle : Circle;
  const tone = state === 'done' ? 'text-success' : state === 'failed' ? 'text-danger' : 'text-ink-muted';
  return (
    <li className="flex gap-3">
      <Icon className={`mt-0.5 size-4.5 shrink-0 ${tone}`} />
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-ink">{title}</p>
        {detail ? <p className="mt-0.5 text-[12.5px] text-ink-muted">{detail}</p> : null}
      </div>
    </li>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <dt className="text-[11.5px] text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-[13px] font-medium break-words text-ink">{value || '—'}</dd>
    </div>
  );
}

const nseStepState = (step: HufDetail['steps']['ucc']): StepState => (!step ? 'todo' : step.ok ? 'done' : 'failed');

export default async function HufPage({ params }: { params: Promise<{ id: string }> }): Promise<React.JSX.Element> {
  const { id } = await params;
  if (!(await hasPermission('hufs.manage'))) {
    return (
      <>
        <PageHeader title="HUF" />
        <NoAccess what="HUF onboarding" />
      </>
    );
  }
  let huf: HufDetail;
  try {
    huf = await getHuf(id);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }
  const options = await getHufOptions();
  const d = huf.details;
  const { consent, steps, nse } = huf;
  const onNse = Boolean(steps.ucc?.ok);
  const live = options.nse.environment === 'LIVE';
  const bank = nse?.bankStatus?.toUpperCase() ?? null;
  const consentDetail =
    consent.state === 'GIVEN' ? `Agreed ${formatDateTime(consent.at!)} from ${consent.ip}`
      : consent.state === 'PENDING' ? `Link sent, valid until ${formatDateTime(consent.expiresAt!)}`
        : consent.state === 'EXPIRED' ? 'The link expired. Create a new one.' : 'No link yet';

  return (
    <>
      <Link href="/onboarding/hufs" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-3.5" />
        HUF onboarding
      </Link>
      <PageHeader
        title={huf.hufName}
        description={`Karta ${huf.kartaName} · client code ${huf.clientCode} · ${live ? 'NSE live' : 'NSE UAT'}`}
        actions={
          <>
            <Badge tone={HufStatusTone[huf.status]} dot>
              {HufStatusLabel[huf.status]}
            </Badge>
            {huf.canEdit ? (
              <Link
                href={`/onboarding/hufs/${id}/edit`}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 text-[13px] font-medium text-ink hover:bg-surface-sunken"
              >
                <Pencil className="size-3.5" />
                Edit
              </Link>
            ) : null}
          </>
        }
      />

      {huf.problems.length ? (
        <div role="alert" className="mb-4 space-y-1 rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-[13px] text-danger">
          {huf.problems.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Onboarding" subtitle="Each step must finish before the next. Approving again re-runs only the steps that did not finish." />
            <CardBody>
              <ol className="space-y-4">
                <Step state="done" title="Prepared" detail={`By ${huf.createdBy?.name ?? 'a colleague'} on ${formatDate(huf.createdAt)}`} />
                <Step state={consent.state === 'GIVEN' ? 'done' : consent.state === 'EXPIRED' ? 'failed' : 'todo'} title="Karta's consent" detail={consentDetail} />
                <Step
                  state={huf.approvedBy ? 'done' : 'todo'}
                  title="Approved by a colleague"
                  detail={huf.approvedBy ? `${huf.approvedBy.name}, ${formatDateTime(huf.approvedAt!)}` : options.secondApprover ? 'Someone other than the preparer' : null}
                />
                <Step
                  state={!steps.duplicateCheck ? 'todo' : steps.duplicateCheck.codes.some((c) => c !== huf.clientCode) && !onNse ? 'failed' : 'done'}
                  title="Duplicate check on NSE"
                  detail={steps.duplicateCheck ? (steps.duplicateCheck.codes.length ? `NSE already has this PAN as ${steps.duplicateCheck.codes.join(', ')}` : 'No other client code for this PAN') : null}
                />
                <Step state={nseStepState(steps.ucc)} title="Client registered on NSE (UCC)" detail={steps.ucc?.remark ?? (steps.ucc?.ok ? formatDateTime(steps.ucc.at) : null)} />
                <Step state={nseStepState(steps.fatca)} title="FATCA, with the karta as beneficial owner" detail={steps.fatca?.remark} />
                <Step
                  state={bank === 'ACTIVE' ? 'done' : bank && bank !== 'PENDING' ? 'failed' : 'todo'}
                  title="NSE's bank check"
                  detail={nse ? `${nse.bankStatus ?? 'Not reported yet'}${nse.bankRemark ? ` · ${nse.bankRemark}` : ''}` : onNse ? 'Refresh to read it (takes a few minutes after registration)' : null}
                />
                <Step
                  state={huf.status === 'ACTIVE' ? 'done' : 'todo'}
                  title="Karta authorises on NSE (link + OTP)"
                  detail={
                    huf.status === 'ACTIVE' ? 'Active'
                      : nse && nse.authorised === null ? "NSE doesn't report this for HUFs. An accepted order confirms it; then mark it active."
                        : null
                  }
                />
              </ol>
            </CardBody>
          </Card>

          {nse?.fatca ? (
            <Card>
              <CardHeader title="FATCA at the registrars" subtitle={`Read ${formatDateTime(nse.checkedAt)}. A rejection can hold up allotments in that registrar's funds.`} />
              <CardBody className="grid gap-4 sm:grid-cols-2">
                {(['cams', 'kfin'] as const).map((r) => (
                  <div key={r}>
                    <p className="mb-1.5 text-[12px] text-ink-muted">{r === 'cams' ? 'CAMS' : 'KFin'}</p>
                    <Badge tone={RegistrarTone[nse.fatca![r].status]}>{RegistrarLabel[nse.fatca![r].status]}</Badge>
                    {nse.fatca![r].remark ? <p className="mt-1.5 text-[12.5px] text-ink-soft">{nse.fatca![r].remark}</p> : null}
                  </div>
                ))}
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Details" subtitle={onNse ? 'Registered on NSE: shown masked, and locked.' : undefined} />
            <CardBody>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                <Row label="HUF PAN" value={d.pan} />
                <Row label="Formed on" value={d.formedOn ? formatDate(d.formedOn) : null} />
                <Row label="Place formed" value={d.placeOfFormation} />
                <Row label="Nature of business" value={d.natureOfBusiness} />
                <Row label="Net worth" value={`₹${d.netWorthLakhs} lakh, as on ${d.netWorthDate ? formatDate(d.netWorthDate) : '—'}`} />
                <Row label="Karta" value={`${d.karta.name} · ${d.karta.pan}`} />
                <Row label="Karta's email" value={d.email} />
                <Row label="Karta's mobile" value={d.mobile} />
                <Row label="Bank account" value={`${d.bankHolderName} · ${d.accountNo} · ${d.ifsc}`} />
                <Row label="Address" value={[d.address1, d.address2, d.address3, d.city, d.pincode].filter(Boolean).join(', ')} />
              </dl>
              {d.coparceners.length ? (
                <div className="mt-4 border-t border-line pt-3">
                  <p className="mb-2 text-[11.5px] text-ink-muted">Co-parceners</p>
                  <ul className="space-y-1 text-[13px] text-ink">
                    {d.coparceners.map((m) => (
                      <li key={`${m.name}-${m.relationship}`}>
                        {m.name} <span className="text-ink-muted">· {m.relationship}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Next" />
            <CardBody className="space-y-4">
              {huf.canRequestConsent ? <ConsentLinkAction id={id} again={consent.state !== 'NONE'} /> : null}
              {huf.status === 'CONSENTED' || huf.status === 'NSE_FAILED' ? (
                huf.approval ? (
                  <p className="text-[13px] text-ink-soft">{huf.approval}</p>
                ) : (
                  <ApproveAction id={id} duplicateCodes={(steps.duplicateCheck?.codes ?? []).filter((c) => c !== huf.clientCode)} live={live} />
                )
              ) : null}
              {onNse ? <RefreshAction id={id} /> : null}
              {huf.authLink && huf.status !== 'ACTIVE' ? (
                <a
                  href={huf.authLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:text-brand-deep"
                >
                  The karta&apos;s NSE authorisation link
                  <ExternalLink className="size-3.5" />
                </a>
              ) : huf.authLinkError && huf.status === 'AWAITING_KARTA' ? (
                <p className="text-[12.5px] text-ink-muted">NSE link not issued yet: {huf.authLinkError}</p>
              ) : null}
              {steps.fatca?.ok && huf.status !== 'ACTIVE' ? <ResendAction id={id} /> : null}
              {huf.status === 'AWAITING_KARTA' ? <MarkActiveAction id={id} /> : null}
              {huf.status === 'ACTIVE' ? <p className="text-[13px] text-success">Active on NSE. The HUF can invest from its own bank account.</p> : null}
              {huf.canCancel ? <CancelAction id={id} /> : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="History" />
            <CardBody>
              <ol className="space-y-3">
                {huf.events.map((e) => (
                  <li key={e.id} className="text-[12.5px]">
                    <p className="font-medium text-ink">{HufEventLabel[e.type] ?? e.type}</p>
                    <p className="text-ink-muted">
                      {formatDateTime(e.createdAt)}
                      {e.staffName ? ` · ${e.staffName}` : ''}
                    </p>
                    {e.note ? <p className="mt-0.5 text-ink-soft">{e.note}</p> : null}
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

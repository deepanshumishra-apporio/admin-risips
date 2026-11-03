import { CheckCircle2, ChevronRight, Circle, Plus, XCircle } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { StatStrip } from '@/components/ui/stat-strip';
import { Table, Td } from '@/components/ui/table';
import { HufDocuments } from '@/features/hufs/components/huf-documents';
import { CopyLink, RefreshInvestments, RequestLink } from '@/features/hufs/components/invest-forms';
import { HufEventLabel, HufStatusLabel, HufStatusTone, RegistrarLabel, RegistrarTone } from '@/features/hufs/labels';
import { fundsOf, inr, orderKind, orderTone, planTone, sentence, unitsText } from '@/features/hufs/portfolio';
import type { HufDetail, HufInvestmentsView, HufOptions, HufRegistrarStatus } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatDate, formatDateTime, timeAgo } from '@/utils/format';

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

function Row({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }): React.JSX.Element {
  return (
    <div className={cn('min-w-0', wide && 'col-span-2')}>
      <dt className="text-[11.5px] text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-[13px] font-medium break-words text-ink">{value || '—'}</dd>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <CardBody>
      <p className="text-[13px] text-ink-muted">{children}</p>
    </CardBody>
  );
}

const nseStepState = (step: HufDetail['steps']['ucc']): StepState => (!step ? 'todo' : step.ok ? 'done' : 'failed');

// --- Onboarding ---------------------------------------------------------------------------------------------

export function OnboardingPanel({ huf, options }: { huf: HufDetail; options: HufOptions }): React.JSX.Element {
  const { consent, steps, nse } = huf;
  const onNse = Boolean(steps.ucc?.ok);
  const bank = nse?.bankStatus?.toUpperCase() ?? null;
  const consentDetail =
    consent.state === 'GIVEN' ? `Agreed ${formatDateTime(consent.at!)} from ${consent.ip}`
      : consent.state === 'PENDING' ? `Link sent, valid until ${formatDateTime(consent.expiresAt!)}`
        : consent.state === 'EXPIRED' ? 'The link expired. Create a new one.' : 'No link yet';
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Steps on NSE" subtitle="Each step must finish before the next. Approving again re-runs only the steps that did not finish." />
        <CardBody>
          <ol className="space-y-4">
            {huf.source === 'NSE' ? (
              <Step
                state="done"
                title="Registered on NSE directly"
                detail={`Not through this admin (e.g. on NSE's portal), so consent and approval aren't recorded here. Created on NSE ${formatDate(huf.createdAt)}.`}
              />
            ) : (
              <>
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
              </>
            )}
            <Step state={nseStepState(steps.ucc)} title="Client registered on NSE (UCC)" detail={steps.ucc?.ok ? `Client code ${huf.clientCode}` : steps.ucc?.remark} />
            <Step state={nseStepState(steps.fatca)} title="FATCA declaration" detail={steps.fatca?.remark ?? (steps.fatca?.ok ? 'Sent to NSE' : null)} />
            <Step
              state={bank === 'ACTIVE' ? 'done' : bank && bank !== 'PENDING' ? 'failed' : 'todo'}
              title="NSE's bank check"
              detail={nse ? `${sentence(nse.bankStatus ?? 'Not reported yet')}${nse.bankRemark ? ` · ${nse.bankRemark}` : ''}` : onNse ? 'Refresh to read it (a few minutes after registration)' : null}
            />
            <Step
              state={huf.status === 'ACTIVE' ? 'done' : 'todo'}
              title="Karta authorises on NSE (link + OTP)"
              detail={huf.status === 'ACTIVE' ? 'Active' : nse && nse.authorised === null ? "NSE doesn't report this for HUFs. An accepted order confirms it; then mark it active." : null}
            />
          </ol>
        </CardBody>
      </Card>

      {nse?.fatca || nse?.aof ? (
        <Card>
          <CardHeader title="At the registrars" subtitle={`CAMS and KFin, read ${formatDateTime(nse.checkedAt)}. A rejection holds up orders in that registrar's funds.`} />
          <CardBody className="grid gap-5 sm:grid-cols-2">
            {([['FATCA declaration', nse.fatca], ['Account opening form (AOF)', nse.aof]] as const).map(([title, v]) => (
              <div key={title} className="space-y-2">
                <p className="text-[12.5px] font-medium text-ink">{title}</p>
                {v ? (
                  (['cams', 'kfin'] as const).map((r) => <Registrar key={r} name={r === 'cams' ? 'CAMS' : 'KFin'} s={v[r]} />)
                ) : (
                  <p className="text-[12.5px] text-ink-muted">Not on NSE yet</p>
                )}
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}

      <HufDocuments huf={huf} />
    </div>
  );
}

function Registrar({ name, s }: { name: string; s: HufRegistrarStatus }): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-baseline gap-2 text-[12.5px]">
      <span className="w-10 text-ink-muted">{name}</span>
      <Badge tone={RegistrarTone[s.status]}>{RegistrarLabel[s.status]}</Badge>
      {s.remark ? <span className="basis-full pl-12 text-ink-soft">{s.remark}</span> : null}
    </div>
  );
}

// --- Portfolio ----------------------------------------------------------------------------------------------

export function PortfolioPanel({ hufId, view }: { hufId: string; view: HufInvestmentsView }): React.JSX.Element {
  const inv = view.investments;
  const funds = inv ? fundsOf(inv) : [];
  const gain = inv && inv.totals.value !== null ? inv.totals.value - inv.totals.invested : null;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-[12.5px] text-ink-muted">
          <RefreshInvestments hufId={hufId} />
          <span>{view.readAt ? `Read from NSE ${timeAgo(view.readAt)}; again once a day on its own.` : 'Not read from NSE yet.'}</span>
        </div>
        {view.block ? null : (
          <Link
            href={`/onboarding/hufs/${hufId}/invest`}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-brand px-3.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-strong"
          >
            <Plus className="size-4" />
            Invest
          </Link>
        )}
      </div>
      {view.block ? <p className="rounded-md border border-warn/25 bg-warn-soft px-4 py-2.5 text-[13px] text-warn">Can&apos;t invest yet: {view.block}</p> : null}

      {inv ? (
        <>
          <StatStrip
            items={[
              { label: 'Current value', value: inr(inv.totals.value), hint: "Units held × the latest NAV in NSE's scheme master" },
              { label: 'Invested', value: inr(inv.totals.invested) },
              { label: 'Gain', value: gain === null ? '—' : inr(gain), ...(gain !== null && inv.totals.invested ? { delta: (gain / inv.totals.invested) * 100 } : {}) },
              { label: 'SIPs', value: inv.totals.activeSips ? `${inv.totals.activeSips} · ${inr(inv.totals.sipMonthly)}/mo` : 'None active' },
            ]}
          />

          <Card>
            <CardHeader title="Mutual funds" subtitle="Each fund the HUF holds or has ordered. Open one for its folios, transactions and details." />
            {funds.length ? (
              <ul className="divide-y divide-line">
                {funds.map((f) => (
                  <li key={f.schemeCode}>
                    <Link href={`/onboarding/hufs/${hufId}/funds/${encodeURIComponent(f.schemeCode)}`} className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-sunken">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-semibold text-ink group-hover:text-brand">{f.schemeName}</p>
                        <p className="mt-0.5 text-[12px] text-ink-muted">
                          {f.units ? `${unitsText(f.units)} units` : 'No units yet'}
                          {f.folios.length ? ` · ${f.folios.length === 1 ? `folio ${f.folios[0]}` : `${f.folios.length} folios`}` : ''}
                          {` · ${f.orders} order${f.orders === 1 ? '' : 's'}`}
                        </p>
                      </div>
                      {f.units ? (
                        <div className="text-right">
                          <p className="tabular text-[14px] font-semibold text-ink">{inr(f.value, 2)}</p>
                          <p className={cn('tabular text-[12px]', (f.gain ?? 0) >= 0 ? 'text-success' : 'text-danger')}>
                            {f.gain === null ? `${inr(f.invested, 2)} invested` : `${f.gain >= 0 ? '+' : ''}${inr(f.gain, 2)}${f.gainPercent !== null ? ` (${f.gainPercent.toFixed(2)}%)` : ''}`}
                          </p>
                        </div>
                      ) : f.lastOrder ? (
                        <Badge tone={orderTone(f.lastOrder.status, f.lastOrder.remark)}>{sentence(f.lastOrder.remark || f.lastOrder.status)}</Badge>
                      ) : null}
                      <ChevronRight className="size-4 shrink-0 text-ink-muted group-hover:text-ink" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>No funds yet. Invest to buy the first one.</Empty>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader title="SIPs" />
              {inv.sips.length ? (
                <CardBody>
                  <ul className="space-y-3">
                    {inv.sips.map((s) => (
                      <li key={s.registrationNo} className="text-[13px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-ink">{s.schemeName}</span>
                          <Badge tone={planTone(s.status)}>{sentence(s.status)}</Badge>
                        </div>
                        <p className="text-ink-muted">{inr(s.amount)} {s.frequency.toLowerCase()} from {s.startDate ?? '—'} · {s.installments ?? '—'} instalments</p>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              ) : (
                <Empty>No SIPs.</Empty>
              )}
            </Card>
            <Card>
              <CardHeader title="Mandates" subtitle="eNACH on the HUF's account, for SIPs" />
              {inv.mandates.length ? (
                <CardBody>
                  <ul className="space-y-3">
                    {inv.mandates.map((m) => (
                      <li key={m.mandateId} className="text-[13px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="tabular font-medium text-ink">{m.mandateId}</span>
                          <Badge tone={planTone(m.status)}>{sentence(m.status)}</Badge>
                        </div>
                        <p className="text-ink-muted">Up to {inr(m.amount)} a debit{m.bankName ? ` · ${m.bankName}` : ''}{m.endDate ? ` · until ${formatDate(m.endDate)}` : ''}{m.remark ? ` · ${m.remark}` : ''}</p>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              ) : (
                <Empty>No mandates.</Empty>
              )}
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <Empty>Nothing read from NSE yet. Press Refresh from NSE.</Empty>
        </Card>
      )}
    </div>
  );
}

// --- Transactions -------------------------------------------------------------------------------------------

const RequestKind: Record<string, string> = { PURCHASE: 'Lumpsum purchase', MANDATE: 'eNACH mandate', SIP: 'Monthly SIP' };

export function OrdersTable({ hufId, orders, linkFunds = true }: { hufId: string; orders: NonNullable<HufInvestmentsView['investments']>['orders']; linkFunds?: boolean }): React.JSX.Element {
  return (
    <Table headers={['Order', 'Date', ...(linkFunds ? ['Fund'] : []), 'Type', 'Amount', 'Folio', 'Status']}>
      {orders.map((o) => (
        <tr key={o.orderId}>
          <Td className="tabular">{o.orderId}</Td>
          <Td className="whitespace-nowrap">{o.date ?? '—'}</Td>
          {linkFunds ? (
            <Td>
              <Link href={`/onboarding/hufs/${hufId}/funds/${encodeURIComponent(o.schemeCode)}`} className="font-medium text-ink hover:text-brand">
                {o.schemeName}
              </Link>
            </Td>
          ) : null}
          <Td>{orderKind(o)}</Td>
          <Td className="tabular">{inr(o.amount)}</Td>
          <Td className="tabular">{o.folio ?? '—'}</Td>
          <Td>
            <Badge tone={orderTone(o.status, o.remark)}>{sentence(o.remark || o.status)}</Badge>
          </Td>
        </tr>
      ))}
    </Table>
  );
}

export function TransactionsPanel({ hufId, view }: { hufId: string; view: HufInvestmentsView }): React.JSX.Element {
  const inv = view.investments;
  return (
    <div className="space-y-4">
      {view.requests.length ? (
        <Card>
          <CardHeader title="Started from here" subtitle="Waiting on the karta until they confirm on NSE. NSE sends each link too; copy it to send it yourself." />
          <CardBody>
            <ul className="space-y-4">
              {view.requests.map((q) => (
                <li key={q.id} className="space-y-1.5 border-b border-line pb-4 text-[13px] last:border-b-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-ink">
                      {RequestKind[q.kind]} · {inr(q.amount)}
                      {q.schemeName ? ` · ${q.schemeName}` : ''}
                    </span>
                    <Badge tone={q.ok ? 'success' : 'danger'}>{q.ok ? `NSE ${q.nseId}` : 'Refused by NSE'}</Badge>
                  </div>
                  <p className="text-ink-muted">
                    {formatDateTime(q.at)}
                    {q.by ? ` · ${q.by}` : ''}
                    {q.remark ? ` · ${q.remark}` : ''}
                  </p>
                  {q.ok ? (
                    q.link ? (
                      <CopyLink url={q.link} />
                    ) : (
                      <span className="flex flex-wrap items-center gap-2 text-ink-muted">
                        No link from NSE yet{q.linkError ? `: ${q.linkError}` : ''}. <RequestLink hufId={hufId} requestId={q.id} />
                      </span>
                    )
                  ) : null}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}
      <Card>
        <CardHeader title="Orders on NSE" subtitle="Every purchase, SIP instalment and redemption, newest first" />
        {inv?.orders.length ? <OrdersTable hufId={hufId} orders={inv.orders} /> : <Empty>No orders on NSE yet.</Empty>}
      </Card>
    </div>
  );
}

// --- Family & bank ------------------------------------------------------------------------------------------

export function FamilyPanel({ huf }: { huf: HufDetail }): React.JSX.Element {
  const d = huf.details;
  const masked = Boolean(huf.steps.ucc?.ok);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="The HUF" subtitle={masked ? 'Registered on NSE: shown masked, and locked.' : undefined} />
        <CardBody>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            <Row label="Name" value={d.hufName} />
            <Row label="HUF PAN" value={d.pan} />
            <Row label="Formed on" value={d.formedOn ? formatDate(d.formedOn) : null} />
            <Row label="Place formed" value={d.placeOfFormation} />
            <Row label="Nature of business" value={d.natureOfBusiness} />
            <Row label="Net worth" value={d.netWorthLakhs ? `₹${d.netWorthLakhs} lakh${d.netWorthDate ? `, as on ${formatDate(d.netWorthDate)}` : ''}` : null} />
          </dl>
        </CardBody>
      </Card>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Karta" subtitle="Acts for the HUF; NSE sends every link and OTP to them" />
          <CardBody>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Row label="Name" value={d.karta.name || 'Not on NSE’s record'} />
              <Row label="PAN" value={d.karta.pan} />
              <Row label="Email" value={d.email} />
              <Row label="Mobile" value={d.mobile} />
            </dl>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Co-parceners" subtitle="The family members in the HUF" />
          {d.coparceners.length ? (
            <CardBody>
              <ul className="space-y-1.5 text-[13px] text-ink">
                {d.coparceners.map((m) => (
                  <li key={`${m.name}-${m.relationship}`}>
                    {m.name} <span className="text-ink-muted">· {sentence(m.relationship)}{m.dateOfBirth ? ` · born ${formatDate(m.dateOfBirth)}` : ''}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          ) : (
            <Empty>{huf.source === 'NSE' ? "Not on NSE's record." : 'None recorded.'}</Empty>
          )}
        </Card>
      </div>
      <Card>
        <CardHeader title="Bank and address" subtitle="All payments and payouts use only this account, in the HUF's name" />
        <CardBody>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            <Row label="Account holder" value={d.bankHolderName} />
            <Row label="Account" value={`${d.accountNo} · ${d.accountType === 'CB' ? 'Current' : 'Savings'}`} />
            <Row label="IFSC" value={d.ifsc} />
            <Row label="Address" value={[d.address1, d.address2, d.address3, d.city, d.pincode].filter(Boolean).join(', ')} />
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}

// --- History ------------------------------------------------------------------------------------------------

export function HistoryPanel({ huf }: { huf: HufDetail }): React.JSX.Element {
  return (
    <Card>
      <CardHeader title="History" subtitle="Everything done for this HUF, newest first" />
      <CardBody>
        <ol className="space-y-3.5">
          {huf.events.map((e) => (
            <li key={e.id} className="border-l-2 border-line pl-3 text-[12.5px]">
              <p className="font-medium text-ink">{HufEventLabel[e.type] ?? sentence(e.type.replaceAll('_', ' '))}</p>
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
  );
}

// --- At a glance --------------------------------------------------------------------------------------------

export function AtAGlance({ huf, view }: { huf: HufDetail; view: HufInvestmentsView | null }): React.JSX.Element {
  const nse = huf.nse;
  const verdict = (v: { cams: HufRegistrarStatus; kfin: HufRegistrarStatus } | null | undefined) =>
    !v ? 'Not on NSE yet'
      : [v.cams.status, v.kfin.status].includes('REJECTED') ? 'Rejected'
        : [v.cams.status, v.kfin.status].includes('ACCEPTED') ? 'Accepted' : 'Pending';
  return (
    <Card>
      <CardHeader title="At a glance" />
      <CardBody>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          {/* Status labels run long ("Waiting on the karta (NSE link)"); a half-width cell lets the badge spill over its neighbour. */}
          <Row label="Status" wide value={<Badge tone={HufStatusTone[huf.status]} className="max-w-full whitespace-normal">{HufStatusLabel[huf.status]}</Badge>} />
          <Row label="Client code" value={huf.clientCode} />
          <Row label="Value" value={view?.investments ? inr(view.investments.totals.value) : '—'} />
          <Row label="Bank check" value={nse?.bankStatus ? sentence(nse.bankStatus) : '—'} />
          <Row label="FATCA" value={verdict(nse?.fatca)} />
          <Row label="AOF" value={verdict(nse?.aof)} />
        </dl>
      </CardBody>
    </Card>
  );
}

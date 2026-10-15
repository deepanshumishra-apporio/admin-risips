import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { AlertActions } from '@/features/compliance/components/alert-actions';
import { EventLabel, KindLabel, KindRule, SeverityLabel, SeverityToneOf, StatusLabel, StatusToneOf } from '@/features/compliance/labels';
import { ApiError } from '@/lib/api/errors';
import { getComplianceAlert, listComplianceAssignees } from '@/lib/api/compliance';
import { hasPermission } from '@/lib/auth/session';
import type { ComplianceAlertDetail } from '@/types/admin-api.types';
import { formatDateTime } from '@/utils/format';

export const metadata: Metadata = { title: 'Compliance alert · RiSips Admin' };

type AlertPageProps = { params: Promise<{ id: string }> };

const EntityLabel = { order: 'Order', plan: 'SIP / plan', mandate: 'AutoPay mandate', account: 'Investment account', ticket: 'Support ticket' } as const;

function Fact({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-[13px]">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  );
}

export default async function ComplianceAlertPage({ params }: AlertPageProps): Promise<React.JSX.Element> {
  const back = (
    <Link href="/compliance" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
      <ArrowLeft className="size-3.5" />
      Compliance
    </Link>
  );
  if (!(await hasPermission('compliance.manage'))) {
    return (
      <>
        {back}
        <PageHeader title="Compliance alert" />
        <NoAccess what="the compliance queue" />
      </>
    );
  }

  const { id } = await params;
  let alert: ComplianceAlertDetail;
  try {
    alert = await getComplianceAlert(id);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }
  const assignees = await listComplianceAssignees();

  return (
    <>
      {back}
      <PageHeader
        title={alert.title}
        description={`${KindLabel[alert.kind]} · first detected ${formatDateTime(alert.firstDetectedAt)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={SeverityToneOf[alert.severity]} dot>
              {SeverityLabel[alert.severity]}
            </Badge>
            <Badge tone={StatusToneOf[alert.status]}>{StatusLabel[alert.status]}</Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader title="What was found" subtitle={KindRule[alert.kind]} />
            <CardBody>
              <p className="text-[14px] leading-relaxed text-ink">{alert.detail}</p>
              {alert.resolution ? (
                <div className="mt-4 rounded-lg border border-line bg-surface-sunken/60 px-3.5 py-2.5">
                  <p className="text-[12px] font-medium text-ink-muted">
                    {alert.autoResolved ? 'Cleared automatically' : `${StatusLabel[alert.status]} by ${alert.resolvedBy?.name ?? 'staff'}`}
                    {alert.resolvedAt ? ` · ${formatDateTime(alert.resolvedAt)}` : ''}
                  </p>
                  <p className="mt-1 text-[13.5px] text-ink">{alert.resolution}</p>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="History" />
            <ol className="divide-y divide-line">
              {alert.events.map((event) => (
                <li key={event.id} className="px-4 py-2.5">
                  <p className="text-[13px] text-ink">
                    <span className="font-medium">{event.staffName ?? 'Compliance checks'}</span>{' '}
                    <span className="text-ink-soft">· {EventLabel[event.type] ?? event.type}</span>
                  </p>
                  {event.note ? <p className="mt-0.5 text-[13px] whitespace-pre-wrap text-ink-soft">{event.note}</p> : null}
                  <p className="mt-0.5 text-[11.5px] text-ink-muted">{formatDateTime(event.createdAt)}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Act on it" />
            <CardBody>
              <AlertActions alert={alert} assignees={assignees} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Details" />
            <CardBody>
              <dl>
                {alert.investor ? (
                  <Fact label="Investor">
                    <Link href={`/investors/${alert.investor.id}`} className="font-medium text-brand hover:text-brand-deep">
                      {alert.investor.name ?? 'Unnamed investor'}
                    </Link>
                  </Fact>
                ) : null}
                {alert.investor?.pan ? <Fact label="PAN"><span className="tabular">{alert.investor.pan}</span></Fact> : null}
                {alert.investor?.phone ? <Fact label="Phone"><span className="tabular">{alert.investor.phone}</span></Fact> : null}
                {alert.entity ? <Fact label="Concerns">{EntityLabel[alert.entity.type]}</Fact> : null}
                <Fact label="Assignee">{alert.assignee?.name ?? 'Unassigned'}</Fact>
                <Fact label="Last seen by the checks">{formatDateTime(alert.lastDetectedAt)}</Fact>
                {alert.lastRemindedAt ? <Fact label="Investor reminded">{formatDateTime(alert.lastRemindedAt)}</Fact> : null}
              </dl>
              {alert.entity?.type === 'order' ? (
                <Link href={`/transactions?q=${encodeURIComponent(alert.investor?.name ?? '')}`} className="mt-3 inline-block text-[13px] font-medium text-brand hover:text-brand-deep">
                  See this investor&apos;s orders in Transactions
                </Link>
              ) : null}
              {alert.entity?.type === 'ticket' ? (
                <Link href={`/support/${alert.entity.id}`} className="mt-3 inline-block text-[13px] font-medium text-brand hover:text-brand-deep">
                  Open the ticket
                </Link>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

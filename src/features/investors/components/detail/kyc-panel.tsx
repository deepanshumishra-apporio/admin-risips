import { CheckCircle2, CircleDashed, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Table, Td } from '@/components/ui/table';
import { NextStepLabel } from '@/features/investors/labels';
import type { InvestorDetail } from '@/types/admin-api.types';
import { formatDateTime, humanize } from '@/utils/format';

function Verdict({ label, check }: { label: string; check: { status: string | null; code: string | null } }): React.JSX.Element {
  const Icon = check.status === 'verified' ? CheckCircle2 : check.status ? XCircle : CircleDashed;
  const color = check.status === 'verified' ? 'text-success' : check.status ? 'text-danger' : 'text-ink-muted';

  return (
    <li className="flex items-start gap-2 text-[13px]">
      <Icon className={`mt-0.5 size-4 shrink-0 ${color}`} />
      <span>
        <span className="font-medium text-ink">{label}</span>
        <span className="block text-[12px] text-ink-muted">
          {check.status ? humanize(check.status) : 'Pending'}
          {check.code ? ` · ${humanize(check.code)}` : ''}
        </span>
      </span>
    </li>
  );
}

const FormTone = (status: string): 'success' | 'danger' | 'warn' =>
  status === 'SUBMITTED' ? 'success' : status === 'FAILED' || status === 'EXPIRED' ? 'danger' : 'warn';

export function KycPanel({ kyc }: { kyc: InvestorDetail['kyc'] }): React.JSX.Element {
  const { panCheck, forms } = kyc;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="PAN check"
          subtitle={panCheck ? `Latest verdict · ${formatDateTime(panCheck.at)}` : 'Not run yet'}
          action={
            panCheck ? (
              <Badge tone={panCheck.readinessStatus === 'verified' ? 'success' : 'danger'}>
                {panCheck.readinessStatus === 'verified' ? 'Ready' : 'Not ready'}
              </Badge>
            ) : null
          }
        />
        {panCheck ? (
          <CardBody className="space-y-3">
            <ul className="grid gap-3 sm:grid-cols-3">
              <Verdict label="PAN" check={panCheck.pan} />
              <Verdict label="Name" check={panCheck.name} />
              <Verdict label="Date of birth" check={panCheck.dateOfBirth} />
            </ul>
            {panCheck.readinessStatus !== 'verified' && (panCheck.readinessCode || panCheck.readinessReason) ? (
              <p className="rounded-md bg-surface-sunken px-3 py-2 text-[12.5px] text-ink-soft">
                {panCheck.readinessReason ?? humanize(panCheck.readinessCode)}
              </p>
            ) : null}
          </CardBody>
        ) : (
          <CardBody>
            <p className="text-[13px] text-ink-muted">The investor hasn&apos;t entered their PAN yet.</p>
          </CardBody>
        )}
      </Card>

      <Card>
        <CardHeader title="Digital KYC forms" subtitle="Only needed when the PAN isn't already KYC-compliant at the KRA" />
        {forms.length === 0 ? (
          <CardBody>
            <p className="text-[13px] text-ink-muted">No KYC form has been opened.</p>
          </CardBody>
        ) : (
          <Table headers={['Opened', 'Type', 'Status', 'Next step', 'Aadhaar', 'Signature', 'e-Sign']}>
            {forms.map((form) => (
              <tr key={form.id}>
                <Td className="text-[13px]">{formatDateTime(form.createdAt)}</Td>
                <Td>{humanize(form.type)}</Td>
                <Td>
                  <Badge tone={FormTone(form.status)}>{humanize(form.status)}</Badge>
                  {form.reason ? <span className="mt-1 block text-[11.5px] text-ink-muted">{humanize(form.reason)}</span> : null}
                </Td>
                <Td className="text-[13px]">
                  {form.nextStep ? NextStepLabel[form.nextStep] : '—'}
                  {form.outstandingFields.length ? (
                    <span className="block text-[11.5px] text-ink-muted">
                      Needs: {form.outstandingFields.map(humanize).join(', ')}
                    </span>
                  ) : null}
                </Td>
                <Td className="text-[13px]">{humanize(form.proofStatus)}</Td>
                <Td className="text-[13px]">{form.signatureProvided ? 'Provided' : '—'}</Td>
                <Td className="text-[13px]">{humanize(form.esignStatus)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

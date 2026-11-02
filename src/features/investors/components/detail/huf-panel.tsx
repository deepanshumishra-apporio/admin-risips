import Link from 'next/link';

import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Table, Td } from '@/components/ui/table';
import type { FatcaRegistrarStatus, HufDetails, NseRegistration } from '@/types/admin-api.types';
import { formatDate, formatDateTime, humanize } from '@/utils/format';

const FatcaTone: Record<FatcaRegistrarStatus['status'], BadgeTone> = {
  NOT_SENT: 'neutral',
  PENDING: 'warn',
  ACCEPTED: 'success',
  REJECTED: 'danger',
};

function Row({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <dt className="text-[11.5px] text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-[13px] font-medium text-ink">{children}</dd>
    </div>
  );
}

function Fatca({ registrar, value }: { registrar: string; value: FatcaRegistrarStatus }): React.JSX.Element {
  return (
    <div>
      <Badge tone={FatcaTone[value.status]}>
        {registrar}: {humanize(value.status)}
      </Badge>
      {value.remark ? <p className="mt-1 text-[12px] text-ink-muted">{value.remark}</p> : null}
    </div>
  );
}

/**
 * The family behind a HUF (karta and co-parceners), and where its NSE
 * registration has got to. Either part shows on its own: an individual
 * registered on NSE has only the second.
 */
export function HufPanel({ huf, nse }: { huf: HufDetails | null; nse: NseRegistration | null }): React.JSX.Element {
  const bank = nse?.bankStatus?.toUpperCase() ?? null;
  return (
    <div className="space-y-4">
      {huf ? (
        <Card>
          <CardHeader title="Hindu Undivided Family" subtitle="Invests under its own PAN and bank account; the karta acts for it" />
          <CardBody>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <Row label="Karta">
                {huf.karta ? (
                  <Link href={`/investors/${huf.karta.id}`} className="text-brand hover:text-brand-deep">
                    {huf.karta.name ?? 'Open record'}
                  </Link>
                ) : (
                  <span className="text-ink-muted">Not linked</span>
                )}
                {huf.karta?.pan ? <span className="tabular ml-1.5 text-ink-muted">{huf.karta.pan}</span> : null}
              </Row>
              <Row label="Formed on">{huf.formedOn ? formatDate(huf.formedOn) : <span className="text-ink-muted">Not given</span>}</Row>
              <Row label="Nature of business">{huf.natureOfBusiness ? humanize(huf.natureOfBusiness) : <span className="text-ink-muted">Not given</span>}</Row>
            </dl>
          </CardBody>
          {huf.coparceners.length ? (
            <Table headers={['Co-parcener', 'Relationship', 'Date of birth']}>
              {huf.coparceners.map((member) => (
                <tr key={`${member.name}-${member.relationship}`}>
                  <Td className="font-medium text-ink">{member.name}</Td>
                  <Td>{humanize(member.relationship)}</Td>
                  <Td>{member.dateOfBirth ? formatDate(member.dateOfBirth) : '—'}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <CardBody className="border-t border-line">
              <p className="text-[13px] text-ink-muted">No co-parceners on record.</p>
            </CardBody>
          )}
        </Card>
      ) : null}

      <Card>
        <CardHeader title="NSE registration" subtitle="Client (UCC), FATCA, bank check and authorisation on NSE Invest" />
        <CardBody>
          {nse ? (
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <Row label="Client code">
                <span className="tabular">{nse.clientCode ?? '—'}</span>
                {nse.registeredAt ? <span className="ml-1.5 text-ink-muted">since {formatDateTime(nse.registeredAt)}</span> : null}
              </Row>
              <Row label="Bank check">
                <Badge tone={bank === 'ACTIVE' ? 'success' : bank === 'PENDING' || !bank ? 'warn' : 'danger'}>
                  {bank ? humanize(bank) : 'Not reported'}
                </Badge>
                {nse.bankRemark ? <p className="mt-1 text-[12px] font-normal text-ink-muted">{nse.bankRemark}</p> : null}
              </Row>
              <Row label="FATCA">
                {nse.fatca ? (
                  <div className="space-y-2">
                    <Fatca registrar="CAMS" value={nse.fatca.cams} />
                    <Fatca registrar="KFin" value={nse.fatca.kfin} />
                  </div>
                ) : (
                  <Badge tone="warn">Not uploaded</Badge>
                )}
              </Row>
              <Row label="Authorised by the investor">
                {nse.authorised === null ? (
                  <span className="font-normal text-ink-muted">
                    Not reported. NSE&apos;s authorisation report is empty for HUFs; an accepted order shows it is active.
                  </span>
                ) : (
                  <Badge tone={nse.authorised ? 'success' : 'warn'}>{nse.authorised ? 'Authorised' : 'Waiting on the link'}</Badge>
                )}
              </Row>
            </dl>
          ) : (
            <p className="text-[13px] text-ink-muted">Not registered on NSE yet.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

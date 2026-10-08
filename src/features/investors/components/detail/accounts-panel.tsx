import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Table, Td } from '@/components/ui/table';
import type { InvestorDetail } from '@/types/admin-api.types';
import { formatDate, formatInrString, humanize } from '@/utils/format';

/** A penny-drop only counts at high or very-high ownership confidence, as the API decides for payouts. */
const bankVerified = (bank: InvestorDetail['bankAccounts'][number]): boolean =>
  bank.verificationStatus === 'COMPLETED' && (bank.verificationConfidence === 'VERY_HIGH' || bank.verificationConfidence === 'HIGH');

type AccountsPanelProps = Pick<InvestorDetail, 'bankAccounts' | 'nomination' | 'mandates'>;

export function AccountsPanel({ bankAccounts, nomination, mandates }: AccountsPanelProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Bank accounts" />
        {bankAccounts.length === 0 ? (
          <CardBody>
            <p className="text-[13px] text-ink-muted">No bank account added yet.</p>
          </CardBody>
        ) : (
          <Table headers={['Bank', 'Account', 'IFSC', 'Type', 'Verification']}>
            {bankAccounts.map((bank) => (
              <tr key={bank.id}>
                <Td>
                  <span className="font-medium text-ink">{bank.bankName ?? 'Bank'}</span>
                  {bank.isPayout ? <Badge tone="brand" className="ml-2">Payout</Badge> : null}
                </Td>
                <Td className="tabular">{bank.accountNumber}</Td>
                <Td className="tabular">{bank.ifscCode}</Td>
                <Td>{humanize(bank.type)}</Td>
                <Td>
                  <Badge tone={bankVerified(bank) ? 'success' : bank.verificationStatus === 'FAILED' ? 'danger' : 'warn'}>
                    {bankVerified(bank) ? 'Verified' : humanize(bank.verificationStatus ?? 'not_verified')}
                  </Badge>
                  {bank.verificationConfidence && !bankVerified(bank) ? (
                    <span className="mt-1 block text-[11.5px] text-ink-muted">
                      Confidence: {humanize(bank.verificationConfidence)}
                    </span>
                  ) : null}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader title="Nomination" />
        <CardBody>
          {nomination.nominees.length ? (
            <ul className="space-y-2">
              {nomination.nominees.map((nominee) => (
                <li key={`${nominee.name}-${nominee.relationship}`} className="flex justify-between text-[13px]">
                  <span>
                    <span className="font-medium text-ink">{nominee.name}</span>
                    <span className="ml-2 text-ink-muted">{humanize(nominee.relationship)}</span>
                  </span>
                  <span className="tabular text-ink-soft">{Number(nominee.allocationPercentage)}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-ink-muted">
              {nomination.optedOut ? 'Opted out of nomination.' : 'Not answered yet.'}
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Mandates" />
        {mandates.length === 0 ? (
          <CardBody>
            <p className="text-[13px] text-ink-muted">No mandate set up.</p>
          </CardBody>
        ) : (
          <Table headers={['Type', 'Status', 'Limit', 'Approved', 'Created']}>
            {mandates.map((mandate) => (
              <tr key={mandate.id}>
                <Td>{humanize(mandate.type)}</Td>
                <Td>
                  <Badge tone={mandate.status === 'APPROVED' ? 'success' : mandate.status === 'REJECTED' ? 'danger' : 'warn'}>
                    {humanize(mandate.status)}
                  </Badge>
                </Td>
                <Td className="tabular">{formatInrString(mandate.limit, { compact: false })}</Td>
                <Td className="text-[13px]">{mandate.approvedAt ? formatDate(mandate.approvedAt) : '—'}</Td>
                <Td className="text-[13px]">{formatDate(mandate.createdAt)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

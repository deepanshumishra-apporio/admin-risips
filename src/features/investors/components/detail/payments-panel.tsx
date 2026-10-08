import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Table, Td } from '@/components/ui/table';
import { ItemRow } from '@/features/investors/components/item-panel/item-panel';
import { stateTone } from '@/features/investors/money-labels';
import type { Payment } from '@/types/admin-api.types';
import { formatDateTime, formatInrString, humanize } from '@/utils/format';

export function PaymentsPanel({ payments }: { payments: Payment[] }): React.JSX.Element {
  return (
    <Card>
      <CardHeader title="Payments" subtitle="Latest 25" />
      {payments.length === 0 ? (
        <CardBody>
          <p className="text-[13px] text-ink-muted">No payments yet.</p>
        </CardBody>
      ) : (
        <Table headers={['Created', 'Type', 'Amount', 'Status', 'Settled']}>
          {payments.map((payment) => (
            <ItemRow key={payment.id} item={{ type: 'payment', id: payment.id }} label={`payment ${payment.amount}`}>
              <Td className="text-[13px]">{formatDateTime(payment.createdAt)}</Td>
              <Td>
                {humanize(payment.type)}
              </Td>
              <Td className="tabular font-semibold text-ink">{formatInrString(payment.amount, { compact: false })}</Td>
              <Td>
                <Badge tone={stateTone(payment.status)}>{humanize(payment.status)}</Badge>
                {payment.failureReason ? (
                  <span className="mt-1 block max-w-[220px] truncate text-[11.5px] text-danger" title={payment.failureReason}>
                    {payment.failureReason}
                  </span>
                ) : null}
              </Td>
              <Td className="text-[13px]">{payment.settledAt ? formatDateTime(payment.settledAt) : '—'}</Td>
            </ItemRow>
          ))}
        </Table>
      )}
    </Card>
  );
}

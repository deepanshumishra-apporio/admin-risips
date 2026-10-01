import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Table, Td } from '@/components/ui/table';
import { ItemRow } from '@/features/investors/components/item-panel/item-panel';
import type { InvestorInvestments } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatDate, formatInrString, humanize } from '@/utils/format';

const units = (value: string | null): string => (value === null ? '—' : Number(value).toLocaleString('en-IN', { maximumFractionDigits: 4 }));

export function HoldingsPanel({ investments }: { investments: InvestorInvestments }): React.JSX.Element {
  const { portfolio, folios } = investments;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Holdings"
          subtitle={
            portfolio.asOf
              ? `From the RTA holdings report, valued ${formatDate(portfolio.asOf)}`
              : 'Nothing allotted yet'
          }
        />
        {portfolio.holdings.length === 0 ? (
          <CardBody>
            <p className="text-[13px] text-ink-muted">No units held.</p>
          </CardBody>
        ) : (
          <Table headers={['Scheme', 'Folio', 'Units', 'NAV', 'Invested', 'Current value', 'Gain']}>
            {portfolio.holdings.map((holding) => {
              const gain = holding.gain === null ? null : Number(holding.gain);
              return (
                <ItemRow key={holding.id} item={{ type: 'holding', id: holding.id }} label={`holding ${holding.scheme}`}>
                  <Td>
                    <span className="block font-medium text-ink">{holding.scheme}</span>
                    <span className="tabular block text-[11.5px] text-ink-muted">{holding.isin}</span>
                  </Td>
                  <Td className="tabular text-[13px]">{holding.folioNumber}</Td>
                  <Td className="tabular">
                    {units(holding.units)}
                    {holding.redeemableUnits !== null && holding.redeemableUnits !== holding.units ? (
                      <span className="block text-[11.5px] text-ink-muted">{units(holding.redeemableUnits)} redeemable</span>
                    ) : null}
                  </Td>
                  <Td className="tabular">
                    {holding.nav ? `₹${Number(holding.nav).toLocaleString('en-IN', { maximumFractionDigits: 4 })}` : '—'}
                    {holding.navAsOn ? <span className="block text-[11.5px] text-ink-muted">{formatDate(holding.navAsOn)}</span> : null}
                  </Td>
                  <Td className="tabular">{formatInrString(holding.investedValue, { compact: false })}</Td>
                  <Td className="tabular font-semibold text-ink">{formatInrString(holding.currentValue, { compact: false })}</Td>
                  <Td className={cn('tabular font-medium', gain === null ? '' : gain >= 0 ? 'text-success' : 'text-danger')}>
                    {gain === null ? '—' : `${gain >= 0 ? '+' : '−'}${formatInrString(String(Math.abs(gain)), { compact: false })}`}
                  </Td>
                </ItemRow>
              );
            })}
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader title="Folios" subtitle="One per AMC the investor holds units with" />
        {folios.length === 0 ? (
          <CardBody>
            <p className="text-[13px] text-ink-muted">No folio yet; one is opened by the first allotment at an AMC.</p>
          </CardBody>
        ) : (
          <Table headers={['Folio number', 'AMC', 'Holding pattern', 'Schemes']}>
            {folios.map((folio) => (
              <tr key={folio.number}>
                <Td className="tabular font-medium text-ink">{folio.number}</Td>
                <Td>{folio.amcCode ?? '—'}</Td>
                <Td>{humanize(folio.holdingPattern)}</Td>
                <Td className="tabular">{folio.schemes}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

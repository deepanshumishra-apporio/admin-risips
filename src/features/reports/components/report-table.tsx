import { FileSearch } from 'lucide-react';

import { Badge, type BadgeTone } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, Td } from '@/components/ui/table';
import type { ReportCell, ReportColumn } from '@/types/admin-api.types';
import { cn } from '@/utils/cn';
import { formatCount, formatDate, formatDateTime } from '@/utils/format';

/** Columns that hold an outcome, shown as a badge so failures stand out in a long table. */
const OutcomeColumns = new Set(['state', 'status', 'kycStatus', 'accountStatus']);

const Good = new Set(['Successful', 'Success', 'Active', 'Completed', 'Approved', 'Invested']);
const Bad = new Set(['Failed', 'Rejected', 'Cancelled', 'Reversed', 'Expired', 'Suspended', 'Closed', 'PAN check not passed']);

const toneOf = (value: string): BadgeTone => (Good.has(value) ? 'success' : Bad.has(value) ? 'danger' : 'neutral');

/** Reports show exact figures, not the compacted Cr / L of the dashboard. */
function formatCell(value: ReportCell, column: ReportColumn): string {
  if (value === null || value === '') return '—';
  switch (column.kind) {
    case 'money':
      return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'units':
      return Number(value).toLocaleString('en-IN', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    case 'count':
      return formatCount(Number(value));
    case 'date':
      return formatDate(String(value));
    case 'datetime':
      return formatDateTime(String(value));
    default:
      return String(value);
  }
}

export function ReportTable({
  columns,
  rows,
}: {
  columns: ReportColumn[];
  rows: Record<string, ReportCell>[];
}): React.JSX.Element {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<FileSearch className="size-5" />}
        title="Nothing matches"
        description="No rows for these filters. Widen the date range or clear the filters."
      />
    );
  }

  return (
    <Table headers={columns.map((column) => column.label)}>
      {rows.map((row, index) => (
        <tr key={index} className="transition-colors hover:bg-surface-sunken">
          {columns.map((column) => {
            const value = row[column.key] ?? null;
            const text = formatCell(value, column);
            const numeric = column.kind !== 'text';
            return (
              <Td key={column.key} className={cn('whitespace-nowrap', numeric && 'tabular')}>
                {OutcomeColumns.has(column.key) && value !== null ? (
                  <Badge tone={toneOf(text)}>{text}</Badge>
                ) : (
                  <span className={cn(column.key === 'failureReason' || column.key === 'scheme' ? 'block max-w-[320px] truncate' : undefined)} title={text}>
                    {text}
                  </span>
                )}
              </Td>
            );
          })}
        </tr>
      ))}
    </Table>
  );
}

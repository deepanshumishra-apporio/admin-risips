import { ArrowLeft, Download, TriangleAlert } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { ReportFiltersBar } from '@/features/reports/components/report-filters';
import { ReportTable } from '@/features/reports/components/report-table';
import { isReportKey, ReportName } from '@/features/reports/labels';
import { exportHref, parseReportFilters } from '@/features/reports/search-params';
import { listReports, previewReport } from '@/lib/api/reports';
import { hasPermission } from '@/lib/auth/session';
import { formatCount, formatDateTime } from '@/utils/format';

/** Mirrors the API's cap on one export. */
const ExportLimit = 50_000;

type ReportPageProps = {
  params: Promise<{ key: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: ReportPageProps): Promise<Metadata> {
  const { key } = await params;
  return { title: `${isReportKey(key) ? ReportName[key] : 'Report'} · RiSips Admin` };
}

export default async function ReportPage({ params, searchParams }: ReportPageProps): Promise<React.JSX.Element> {
  const { key } = await params;
  if (!isReportKey(key)) notFound();

  const back = (
    <Link href="/reports" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
      <ArrowLeft className="size-3.5" />
      Reports
    </Link>
  );
  if (!(await hasPermission('reports.read'))) {
    return (
      <>
        {back}
        <PageHeader title={ReportName[key]} />
        <NoAccess what="reports" />
      </>
    );
  }

  const report = (await listReports()).find((candidate) => candidate.key === key);
  if (!report) notFound();
  const query = await searchParams;
  const filters = parseReportFilters(query, report);
  const result = await previewReport(key, filters);
  const exportFailed = query['failed'] !== undefined;
  const exportRows = Math.min(result.total, ExportLimit);

  return (
    <>
      {back}
      <PageHeader
        title={report.name}
        description={report.description}
        actions={
          result.total > 0 ? (
            // A plain link, not a client fetch: the browser downloads the file
            // itself and the session cookie never meets page script.
            <a
              href={exportHref(key, filters)}
              className="inline-flex h-9.5 items-center gap-2 rounded-md border border-transparent bg-brand px-4 text-[13.5px] font-medium text-white transition-colors hover:bg-brand-strong"
            >
              <Download className="size-4" />
              Download CSV
            </a>
          ) : null
        }
      />

      {exportFailed ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-[13px] text-danger">
          <TriangleAlert className="size-4 shrink-0" />
          The export could not be generated. Try again, or narrow the date range.
        </div>
      ) : null}

      <ReportFiltersBar report={report} filters={filters} />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
          <p className="text-[12.5px] text-ink-muted">
            <span className="tabular font-semibold text-ink">{formatCount(result.total)}</span>{' '}
            {result.total === 1 ? 'row' : 'rows'}
            {result.truncated
              ? ` · showing the latest ${formatCount(result.rows.length)}; the CSV has ${formatCount(exportRows)}`
              : ''}
          </p>
          <p className="text-[12px] text-ink-muted">
            Generated {formatDateTime(result.generatedAt)} · identifiers masked · exports are logged
          </p>
        </div>

        <ReportTable columns={result.columns} rows={result.rows} />
      </Card>

      {result.total > ExportLimit ? (
        <p className="mt-2 text-[12px] text-ink-muted">
          One export carries at most {formatCount(ExportLimit)} rows. Narrow the date range to get the rest.
        </p>
      ) : null}
    </>
  );
}

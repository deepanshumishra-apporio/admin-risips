import { ArrowLeftRight, BadgeCheck, ChevronRight, CreditCard, PieChart, Repeat, ShieldAlert, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { NoAccess } from '@/components/ui/no-access';
import { reportHref } from '@/features/reports/search-params';
import { listReports } from '@/lib/api/reports';
import { hasPermission } from '@/lib/auth/session';
import type { ReportKey } from '@/types/admin-api.types';

export const metadata: Metadata = { title: 'Reports · RiSips Admin' };

const Icon: Record<ReportKey, LucideIcon> = {
  investors: Users,
  kyc: BadgeCheck,
  transactions: ArrowLeftRight,
  plans: Repeat,
  payments: CreditCard,
  aum: PieChart,
  compliance: ShieldAlert,
};

export default async function ReportsPage(): Promise<React.JSX.Element> {
  const header = (
    <PageHeader
      title="Reports"
      description="Run a report on screen, then download it as CSV. PANs, phones and emails are masked, and every export is logged."
    />
  );
  if (!(await hasPermission('reports.read'))) {
    return (
      <>
        {header}
        <NoAccess what="reports" />
      </>
    );
  }

  const reports = await listReports();

  return (
    <>
      {header}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => {
          const ReportIcon = Icon[report.key];
          return (
            <Link key={report.key} href={reportHref(report.key)} className="group">
              <Card className="flex h-full flex-col p-4 transition-colors group-hover:border-brand/40">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-deep">
                    <ReportIcon className="size-4.5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink group-hover:text-brand">
                      {report.name}
                    </h2>
                    <p className="mt-1 text-[13px] text-ink-muted">{report.description}</p>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between pt-4 text-[12px] text-ink-muted">
                  <span>
                    {report.columns.length} columns
                    {report.dateField ? ` · by ${report.dateField.toLowerCase()} date` : ' · current snapshot'}
                  </span>
                  <ChevronRight className="size-4 text-ink-muted group-hover:text-brand" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}

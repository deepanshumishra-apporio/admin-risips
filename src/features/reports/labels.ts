import type { ReportKey } from '@/types/admin-api.types';

export const ReportKeys: readonly ReportKey[] = ['investors', 'kyc', 'transactions', 'plans', 'payments', 'aum', 'compliance'];

/** Report names for the breadcrumb, which renders before the page has fetched the catalogue. */
export const ReportName: Record<ReportKey, string> = {
  investors: 'Investor register',
  kyc: 'KYC status',
  transactions: 'Transactions',
  plans: 'SIP, SWP and STP plans',
  payments: 'Payments',
  aum: 'AUM by scheme',
  compliance: 'Compliance alerts',
};

export const isReportKey = (value: string): value is ReportKey => (ReportKeys as readonly string[]).includes(value);

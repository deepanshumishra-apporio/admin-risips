import 'server-only';

import { authedRequest } from '@/lib/auth/session';
import type { ReportDefinition, ReportFilters, ReportKey, ReportResult } from '@/types/admin-api.types';

export function listReports(): Promise<ReportDefinition[]> {
  return authedRequest('/reports');
}

/** The first rows of a report, with the total the filters match. */
export function previewReport(key: ReportKey, filters: ReportFilters): Promise<ReportResult> {
  return authedRequest(`/reports/${key}`, { query: filters });
}

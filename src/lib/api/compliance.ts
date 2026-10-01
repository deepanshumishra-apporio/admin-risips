import 'server-only';

import { authedRequest } from '@/lib/auth/session';
import type { ComplianceAlertDetail, ComplianceList, ComplianceListQuery, StaffRef } from '@/types/admin-api.types';

export function listComplianceAlerts(query: ComplianceListQuery): Promise<ComplianceList> {
  return authedRequest('/compliance/alerts', {
    query: {
      status: query.status,
      kind: query.kind,
      severity: query.severity,
      assignee: query.assignee,
      search: query.search,
      cursor: query.cursor,
      limit: query.limit,
    },
  });
}

export function getComplianceAlert(alertId: string): Promise<ComplianceAlertDetail> {
  return authedRequest(`/compliance/alerts/${encodeURIComponent(alertId)}`);
}

export function listComplianceAssignees(): Promise<StaffRef[]> {
  return authedRequest('/compliance/assignees');
}

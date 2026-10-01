import type { ReportDefinition, ReportFilters, ReportKey } from '@/types/admin-api.types';

const DatePattern = /^\d{4}-\d{2}-\d{2}$/;

const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? value[0] ?? '' : value ?? '').trim();

/**
 * Filters off the URL, kept only when this report offers them, so a stale or
 * hand-edited link degrades to "no filter" instead of an API error.
 */
export function parseReportFilters(
  params: Record<string, string | string[] | undefined>,
  report: ReportDefinition,
): ReportFilters {
  const from = first(params['from']);
  const to = first(params['to']);
  const status = first(params['status']).toUpperCase();
  const dates = report.dateField !== null;
  const filters: ReportFilters = {
    ...(dates && DatePattern.test(from) && { from }),
    ...(dates && DatePattern.test(to) && { to }),
    ...(report.statuses.some((option) => option.value === status) && { status }),
  };
  // A reversed range would only earn a 400; drop the start rather than fail the page.
  if (filters.from && filters.to && filters.from > filters.to) delete filters.from;
  return filters;
}

function query(filters: ReportFilters): string {
  const params = new URLSearchParams();
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.status) params.set('status', filters.status);
  const text = params.toString();
  return text ? `?${text}` : '';
}

export const reportHref = (key: ReportKey, filters: ReportFilters = {}): string => `/reports/${key}${query(filters)}`;

export const exportHref = (key: ReportKey, filters: ReportFilters): string => `/reports/${key}/export${query(filters)}`;

/** Today in India as yyyy-mm-dd. */
export const istToday = (): string => new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);

const shift = (date: string, days: number): string =>
  new Date(Date.parse(date) + days * 86_400_000).toISOString().slice(0, 10);

/** One-click ranges, all ending today (India time). The financial year starts on 1 April. */
export function quickRanges(): { label: string; from?: string; to?: string }[] {
  const today = istToday();
  const [year, month] = today.split('-').map(Number) as [number, number];
  const fyStart = `${month >= 4 ? year : year - 1}-04-01`;
  return [
    { label: 'All time' },
    { label: 'Today', from: today, to: today },
    { label: 'Last 7 days', from: shift(today, -6), to: today },
    { label: 'Last 30 days', from: shift(today, -29), to: today },
    { label: 'This month', from: `${today.slice(0, 7)}-01`, to: today },
    { label: 'This financial year', from: fyStart, to: today },
  ];
}

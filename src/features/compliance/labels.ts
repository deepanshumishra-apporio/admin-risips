import type { BadgeTone } from '@/components/ui/badge';
import type { ComplianceKind, ComplianceListQuery, ComplianceSeverity, ComplianceStatus } from '@/types/admin-api.types';

/** Filter order: money and monitoring first, then 2FA and KYC, then AML review, then hygiene. */
export const ComplianceKinds: readonly ComplianceKind[] = [
  'MONITORING_STALE', 'PAID_NOT_ALLOTTED', 'REDEMPTION_PAYOUT_PENDING', 'REFUND_PENDING', 'CONSENT_MISSING',
  'MANDATE_REJECTED', 'SIP_FAILURES', 'ORDER_STUCK', 'COMPLAINT_OVERDUE', 'KYC_NOT_COMPLIANT', 'KYC_STALLED', 'KYC_FAILED',
  'PEP_INVESTOR', 'LARGE_TRANSACTION', 'RAPID_ROUND_TRIP', 'MANDATE_PENDING', 'PAYOUT_BANK_UNVERIFIED', 'CONTACT_MISSING', 'NOMINEE_MISSING',
];

export const KindLabel: Record<ComplianceKind, string> = {
  KYC_STALLED: 'KYC stalled',
  KYC_FAILED: 'KYC failed',
  SIP_FAILURES: 'SIP failures',
  MANDATE_REJECTED: 'Mandate rejected',
  MANDATE_PENDING: 'Mandate pending',
  PAID_NOT_ALLOTTED: 'Paid, not allotted',
  ORDER_STUCK: 'Order stuck',
  NOMINEE_MISSING: 'Nominee missing',
  REDEMPTION_PAYOUT_PENDING: 'Redemption not paid out',
  REFUND_PENDING: 'Refund pending',
  CONSENT_MISSING: '2FA consent missing',
  KYC_NOT_COMPLIANT: 'KYC no longer compliant',
  PEP_INVESTOR: 'Politically exposed person',
  LARGE_TRANSACTION: 'Large transaction',
  RAPID_ROUND_TRIP: 'Quick buy and sell',
  COMPLAINT_OVERDUE: 'Complaint overdue',
  PAYOUT_BANK_UNVERIFIED: 'Payout bank unverified',
  CONTACT_MISSING: 'Contact details missing',
  MONITORING_STALE: 'Monitoring stopped',
};

/** What each check looks for, so a reviewer can tell why something is on the queue. */
export const KindRule: Record<ComplianceKind, string> = {
  KYC_STALLED: 'A KYC form that has not moved for 2 days (high after 7).',
  KYC_FAILED: 'KYC failed at the KRA, expired, or the PAN check did not pass.',
  SIP_FAILURES: 'An active SIP whose last 2 or more instalments failed in a row (high at 3).',
  MANDATE_REJECTED: 'The bank rejected an AutoPay mandate that a live SIP depends on.',
  MANDATE_PENDING: 'An AutoPay mandate left unauthorised for 3 days (medium when a SIP depends on it).',
  PAID_NOT_ALLOTTED: 'A purchase whose payment succeeded over an hour ago but never moved on.',
  ORDER_STUCK: 'Confirmed a day ago and not submitted, or with the RTA for over 3 days.',
  NOMINEE_MISSING: 'Holdings with no nomination and no opt-out declaration on the account or its folios.',
  REDEMPTION_PAYOUT_PENDING: 'A successful redemption with no payout (payment date or UTR) recorded after 5 days. SEBI: proceeds within 3 working days.',
  REFUND_PENDING: 'A purchase that failed after its payment succeeded, with no completed refund after 3 days.',
  CONSENT_MISSING: 'An order or plan past review with no SEBI 2FA consent recorded. Review: stays open until a person closes it.',
  KYC_NOT_COMPLIANT: "An investor with an account whose latest KRA check no longer passes (high when they hold units).",
  PEP_INVESTOR: 'A politically exposed person, or a relative of one: PMLA enhanced due diligence. Review: stays open until a person closes it.',
  LARGE_TRANSACTION: 'A single purchase or redemption at or above the review threshold (₹10 lakh by default), last 90 days. Review alert.',
  RAPID_ROUND_TRIP: 'Units redeemed within 30 days of buying the same scheme, last 90 days. Review alert.',
  COMPLAINT_OVERDUE: 'A support ticket past its response deadline (high once open 21 days, the SEBI timeline).',
  PAYOUT_BANK_UNVERIFIED: 'Holdings whose payout bank account is missing or has not passed verification.',
  CONTACT_MISSING: 'Holdings with no communication email or mobile on the account.',
  MONITORING_STALE: 'The data the other checks read has stopped updating, so they may be missing problems.',
};

export const SeverityLabel: Record<ComplianceSeverity, string> = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };
export const SeverityToneOf: Record<ComplianceSeverity, BadgeTone> = { HIGH: 'danger', MEDIUM: 'warn', LOW: 'neutral' };

export const StatusLabel: Record<ComplianceStatus, string> = {
  OPEN: 'Open',
  ACKNOWLEDGED: 'Acknowledged',
  RESOLVED: 'Resolved',
  DISMISSED: 'Dismissed',
};
export const StatusToneOf: Record<ComplianceStatus, BadgeTone> = { OPEN: 'brand', ACKNOWLEDGED: 'violet', RESOLVED: 'success', DISMISSED: 'neutral' };

export const EventLabel: Record<string, string> = {
  DETECTED: 'Detected by the compliance checks',
  ACKNOWLEDGED: 'Acknowledged',
  ASSIGNED: 'Assignment changed',
  RESOLVED: 'Resolved',
  DISMISSED: 'Dismissed',
  REOPENED: 'Reopened',
  AUTO_RESOLVED: 'Resolved automatically',
  REMINDED: 'Reminded the investor',
  NOTE: 'Note',
};

// --- queue views ------------------------------------------------------------------

export const ComplianceViews = ['open', 'mine', 'unassigned', 'high', 'resolved', 'dismissed'] as const;
export type ComplianceView = (typeof ComplianceViews)[number];

export const ViewLabel: Record<ComplianceView, string> = {
  open: 'Open',
  mine: 'Mine',
  unassigned: 'Unassigned',
  high: 'High severity',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

export type ComplianceFilters = { view: ComplianceView; kind: ComplianceKind | null; q: string; cursor: string | null };

type RawParams = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? value[0] ?? '' : value ?? '');
const Uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseComplianceFilters(params: RawParams): ComplianceFilters {
  const view = first(params['view']) as ComplianceView;
  const kind = first(params['kind']).toUpperCase() as ComplianceKind;
  const cursor = first(params['cursor']);
  return {
    view: ComplianceViews.includes(view) ? view : 'open',
    kind: ComplianceKinds.includes(kind) ? kind : null,
    q: first(params['q']).trim().slice(0, 100),
    cursor: Uuid.test(cursor) ? cursor : null,
  };
}

export function toComplianceQuery(filters: ComplianceFilters, limit: number): ComplianceListQuery {
  const base: ComplianceListQuery = {
    limit,
    ...(filters.kind && { kind: [filters.kind] }),
    ...(filters.q && { search: filters.q }),
    ...(filters.cursor && { cursor: filters.cursor }),
  };
  switch (filters.view) {
    case 'mine':
      return { ...base, assignee: 'me' };
    case 'unassigned':
      return { ...base, assignee: 'unassigned' };
    case 'high':
      return { ...base, severity: ['HIGH'] };
    case 'resolved':
      return { ...base, status: ['RESOLVED'] };
    case 'dismissed':
      return { ...base, status: ['DISMISSED'] };
    default:
      return base;
  }
}

export function complianceHref(filters: Partial<ComplianceFilters>): string {
  const params = new URLSearchParams();
  if (filters.view && filters.view !== 'open') params.set('view', filters.view);
  if (filters.kind) params.set('kind', filters.kind);
  if (filters.q) params.set('q', filters.q);
  if (filters.cursor) params.set('cursor', filters.cursor);
  const text = params.toString();
  return text ? `/compliance?${text}` : '/compliance';
}

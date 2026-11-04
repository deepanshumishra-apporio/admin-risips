import type { BadgeTone } from '@/components/ui/badge';
import type { ComplianceKind, ComplianceListQuery, ComplianceSeverity, ComplianceStatus } from '@/types/admin-api.types';

/** Filter order: money and monitoring first, then 2FA and KYC, then AML review, then hygiene. */
export const ComplianceKinds: readonly ComplianceKind[] = [
  'MONITORING_STALE', 'PAID_NOT_ALLOTTED', 'REDEMPTION_PAYOUT_PENDING', 'REFUND_PENDING', 'CONSENT_MISSING',
  'MANDATE_REJECTED', 'SIP_FAILURES', 'ORDER_STUCK', 'COMPLAINT_OVERDUE', 'KYC_NOT_COMPLIANT', 'KYC_STALLED', 'KYC_FAILED', 'FATCA_REJECTED',
  'PEP_INVESTOR', 'LARGE_TRANSACTION', 'RAPID_ROUND_TRIP', 'MANDATE_PENDING', 'AOF_MISSING', 'PAYOUT_BANK_UNVERIFIED', 'CONTACT_MISSING', 'NOMINEE_MISSING',
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
  FATCA_REJECTED: 'FATCA rejected',
  AOF_MISSING: 'HUF AOF missing',
};

/** What each check looks for, as the scan actually does it, so a reviewer can tell why something is on the queue. */
export const KindRule: Record<ComplianceKind, string> = {
  KYC_STALLED: 'KYC not finished 3 days after sign-up.',
  KYC_FAILED: 'The KRA (PAN) check came back as anything but verified, or a fresh KYC application failed or expired. Checked every 6 hours.',
  SIP_FAILURES: 'A SIP with 2 or more failed instalments, or whose first payment failed.',
  MANDATE_REJECTED: 'The bank rejected an AutoPay (eNACH) mandate: high when a live SIP depends on it. Investors every 6 hours; HUFs onboarded here on every scan.',
  MANDATE_PENDING: 'An AutoPay mandate still unauthorised 3 days after it was set up, while a SIP depends on it (for HUFs onboarded here, any mandate).',
  PAID_NOT_ALLOTTED: 'A purchase whose payment succeeded and that is still pending, confirmed or submitted 2 days later.',
  ORDER_STUCK: 'An unpaid order confirmed a day ago and not submitted, or with the registrar for over 3 days.',
  NOMINEE_MISSING: 'An onboarded investor with no nominee and no opt-out (HUFs can’t nominate). Checked every 6 hours.',
  REDEMPTION_PAYOUT_PENDING: 'Not checked yet: needs the redemption’s payout date or UTR from the app. SEBI: proceeds within 3 working days.',
  REFUND_PENDING: 'A purchase that failed after its payment succeeded: the investor is owed a refund.',
  CONSENT_MISSING: 'An order or plan past review (since 1 Oct 2026) with no 2FA OTP recorded by the app. SEBI requires one for every transaction.',
  KYC_NOT_COMPLIANT: 'Not checked yet: needs the investor’s latest KRA status (on hold, rejected, re-KYC due) from the app.',
  PEP_INVESTOR: 'Not checked yet: needs a politically-exposed flag from onboarding (PMLA enhanced due diligence).',
  LARGE_TRANSACTION: 'A single purchase or redemption of ₹5 lakh or more (LARGE_TRANSACTION_AMOUNT on the server). Review under the AML policy.',
  RAPID_ROUND_TRIP: 'Units redeemed within 7 days of buying the same fund.',
  COMPLAINT_OVERDUE: 'A support ticket still open after its SLA deadline. Checked every 6 hours.',
  PAYOUT_BANK_UNVERIFIED: 'NSE’s bank check rejected the account (high; for HUFs onboarded here too), or an onboarded investor’s payout bank isn’t verified (medium).',
  CONTACT_MISSING: 'An onboarded investor with no email or no mobile, so statements and OTPs can’t reach them.',
  MONITORING_STALE: 'One of the app’s background jobs (KYC approvals, SIP first payments, NAVs…) has not succeeded in three of its runs, so the data it keeps current has stopped moving.',
  FATCA_REJECTED: 'CAMS or KFin rejected the FATCA declaration NSE passed on (for a HUF, usually the missing karta UBO details). NSE refuses orders until it’s fixed.',
  AOF_MISSING: 'HUFs onboarded here: NSE has no signed account-opening form (medium), or a registrar rejected it (high). NSE refuses orders without it.',
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

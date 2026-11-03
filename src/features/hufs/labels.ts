import type { BadgeTone } from '@/components/ui/badge';
import type { HufRegistrarStatus, HufStatus } from '@/types/admin-api.types';

export const HufStatusLabel: Record<HufStatus, string> = {
  DRAFT: 'Draft',
  AWAITING_CONSENT: "Waiting on the karta's consent",
  CONSENTED: 'Ready to approve',
  SUBMITTING: 'Sending to NSE',
  NSE_FAILED: 'NSE step failed',
  AWAITING_KARTA: 'Waiting on the karta (NSE link)',
  ACTIVE: 'Active on NSE',
  CANCELLED: 'Cancelled',
};

export const HufStatusTone: Record<HufStatus, BadgeTone> = {
  DRAFT: 'neutral',
  AWAITING_CONSENT: 'warn',
  CONSENTED: 'brand',
  SUBMITTING: 'brand',
  NSE_FAILED: 'danger',
  AWAITING_KARTA: 'warn',
  ACTIVE: 'success',
  CANCELLED: 'neutral',
};

/** The list's tabs, in the order work moves. */
export const HufViews: { key: string; label: string; statuses: HufStatus[] }[] = [
  { key: 'open', label: 'In progress', statuses: ['DRAFT', 'AWAITING_CONSENT', 'CONSENTED', 'SUBMITTING', 'NSE_FAILED', 'AWAITING_KARTA'] },
  { key: 'approve', label: 'To approve', statuses: ['CONSENTED', 'NSE_FAILED'] },
  { key: 'active', label: 'Active', statuses: ['ACTIVE'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['CANCELLED'] },
];

export const RegistrarTone: Record<HufRegistrarStatus['status'], BadgeTone> = {
  NOT_SENT: 'neutral',
  PENDING: 'warn',
  ACCEPTED: 'success',
  REJECTED: 'danger',
};

export const RegistrarLabel: Record<HufRegistrarStatus['status'], string> = {
  NOT_SENT: 'Not sent yet',
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
};

export const HufEventLabel: Record<string, string> = {
  CREATED: 'Prepared',
  EDITED: 'Details changed',
  CONSENT_LINK: 'Consent link created',
  CONSENT_GIVEN: 'Karta gave consent',
  APPROVED: 'Approved and sent to NSE',
  UCC_REGISTERED: 'Client registered on NSE (UCC)',
  UCC_FAILED: 'NSE refused the client registration',
  FATCA_UPLOADED: 'FATCA uploaded, karta as beneficial owner',
  FATCA_FAILED: 'NSE refused the FATCA upload',
  NSE_FAILED: 'Stopped at an NSE step',
  LINK_RESENT: 'Authorisation link re-sent',
  AOF_UPLOADED: 'Signed AOF sent to NSE',
  AOF_FAILED: 'NSE refused the AOF',
  FATCA_FORM_UPLOADED: 'Signed FATCA form sent to NSE',
  FATCA_FORM_FAILED: 'NSE refused the FATCA form',
  CANCELLED_CHEQUE_UPLOADED: 'Cancelled cheque sent to NSE',
  CANCELLED_CHEQUE_FAILED: 'NSE refused the cancelled cheque',
  ACTIVE: 'Active',
  CANCELLED: 'Cancelled',
};

import type { BadgeTone } from '@/components/ui/badge';
import type { AnnouncementAudience, AnnouncementCategory, AnnouncementInput, AnnouncementStatus, CtaAction } from '@/types/admin-api.types';

export const Audiences: readonly AnnouncementAudience[] = ['ALL_INVESTORS', 'INVESTED', 'ACTIVE_SIP', 'NO_SIP', 'READY_NOT_INVESTED', 'KYC_PENDING'];

export const AudienceLabel: Record<AnnouncementAudience, string> = {
  ALL_INVESTORS: 'All investors',
  INVESTED: 'Invested',
  ACTIVE_SIP: 'Running a SIP',
  NO_SIP: 'Invested, no SIP',
  READY_NOT_INVESTED: 'Ready, not invested yet',
  KYC_PENDING: 'KYC not complete',
};

export const AudienceHint: Record<AnnouncementAudience, string> = {
  ALL_INVESTORS: 'Every active investor account.',
  INVESTED: 'Investors with at least one completed purchase.',
  ACTIVE_SIP: 'Investors with at least one active SIP.',
  NO_SIP: 'Invested investors with no active SIP — the step-up and first-SIP audience.',
  READY_NOT_INVESTED: 'KYC and account done, but nothing invested yet.',
  KYC_PENDING: 'Signed up but KYC is not complete.',
};

export const CategoryLabel: Record<AnnouncementCategory, string> = { PROMOTIONAL: 'Promotional', INFORMATIONAL: 'Informational' };

export const StatusLabel: Record<AnnouncementStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Awaiting approval',
  REJECTED: 'Rejected',
  SCHEDULED: 'Scheduled',
  LIVE: 'Live',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const StatusTone: Record<AnnouncementStatus, BadgeTone> = {
  DRAFT: 'neutral',
  PENDING_APPROVAL: 'warn',
  REJECTED: 'danger',
  SCHEDULED: 'brand',
  LIVE: 'success',
  COMPLETED: 'neutral',
  CANCELLED: 'neutral',
};

export const CtaActions: readonly CtaAction[] = ['start_sip', 'invest', 'sips', 'none'];
export const CtaActionLabel: Record<CtaAction, string> = {
  start_sip: 'Start a SIP',
  invest: 'Invest (one-time)',
  sips: 'My SIPs',
  none: 'No action — just close',
};

/** Mirrors the API's delivery rules, so the composer can say what will happen. */
export const Guardrails = { quietFrom: '21:00', quietTo: '08:00', weeklyCap: 2 };

/** Starting copy. Anything that promises money back must match an offer the business is actually running. */
export const Templates: { id: string; label: string; input: Partial<AnnouncementInput> }[] = [
  {
    id: 'festive',
    label: 'Festive SIP offer',
    input: {
      category: 'PROMOTIONAL',
      audience: 'NO_SIP',
      title: 'Start a SIP this festive season',
      body: 'Hi {{firstName}}, start or step up a SIP this season and put your savings to work every month.',
      sendNotification: true,
      showBanner: true,
      tag: 'FESTIVE OFFER',
      bannerTitle: 'Festive season SIPs',
      bannerBody: 'Start a SIP in two minutes',
      ctaLabel: 'Start a SIP',
      ctaAction: 'start_sip',
    },
  },
  {
    id: 'first-investment',
    label: 'Nudge to first investment',
    input: {
      category: 'PROMOTIONAL',
      audience: 'READY_NOT_INVESTED',
      title: 'Your account is ready, {{firstName}}',
      body: 'Your KYC and bank are all set. Start with as little as ₹100 a month.',
      sendNotification: true,
      showBanner: false,
      ctaAction: null,
    },
  },
  {
    id: 'kyc',
    label: 'Finish KYC reminder',
    input: {
      category: 'INFORMATIONAL',
      audience: 'KYC_PENDING',
      title: 'Finish your KYC to start investing',
      body: 'Hi {{firstName}}, your KYC is a few steps from done. It takes about two minutes.',
      sendNotification: true,
      showBanner: false,
      ctaAction: null,
    },
  },
  {
    id: 'notice',
    label: 'Service notice',
    input: {
      category: 'INFORMATIONAL',
      audience: 'ALL_INVESTORS',
      title: 'Scheduled maintenance',
      body: 'The app will be unavailable briefly for maintenance. Orders placed before then are not affected.',
      sendNotification: true,
      showBanner: false,
      ctaAction: null,
    },
  },
];

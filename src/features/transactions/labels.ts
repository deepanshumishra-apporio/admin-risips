import type { BadgeTone } from '@/components/ui/badge';
import type { MonitorOrderState, OrderFlag, OrderType } from '@/types/admin-api.types';

export const OrderTypes: readonly OrderType[] = [
  'PURCHASE', 'SIP_INSTALLMENT', 'REDEMPTION', 'SWP_INSTALLMENT', 'SWITCH', 'STP_INSTALLMENT',
];

export const OrderTypeLabel: Record<OrderType, string> = {
  PURCHASE: 'Purchase',
  SIP_INSTALLMENT: 'SIP instalment',
  REDEMPTION: 'Redemption',
  SWP_INSTALLMENT: 'SWP instalment',
  SWITCH: 'Switch',
  STP_INSTALLMENT: 'STP instalment',
};

export const OrderStates: readonly MonitorOrderState[] = [
  'UNDER_REVIEW', 'PENDING', 'CONFIRMED', 'SUBMITTED', 'SUCCESSFUL', 'FAILED', 'CANCELLED', 'REVERSED',
];

export const OrderStateLabel: Record<MonitorOrderState, string> = {
  UNDER_REVIEW: 'Under review',
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  SUBMITTED: 'With the RTA',
  SUCCESSFUL: 'Successful',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  REVERSED: 'Reversed',
};

export const OrderFlags: readonly OrderFlag[] = [
  'FAILED', 'PAID_NOT_CONFIRMED', 'NOT_SUBMITTED', 'STUCK_AT_RTA', 'AWAITING_INVESTOR',
];

export const FlagLabel: Record<OrderFlag, string> = {
  FAILED: 'Failed',
  PAID_NOT_CONFIRMED: 'Paid, not confirmed',
  NOT_SUBMITTED: 'Not submitted',
  STUCK_AT_RTA: 'Stuck at RTA',
  AWAITING_INVESTOR: 'Waiting on investor',
};

/** What each flag means, for the tooltip and the attention panel. */
export const FlagHint: Record<OrderFlag, string> = {
  FAILED: 'Failed or reversed at FP or the RTA in the last 7 days.',
  PAID_NOT_CONFIRMED: 'The payment succeeded over an hour ago but the order never moved on.',
  NOT_SUBMITTED: 'Confirmed over a day ago and still not sent to the RTA.',
  STUCK_AT_RTA: 'With the RTA for over three days without an outcome.',
  AWAITING_INVESTOR: 'Placed over a day ago, still waiting for the investor to consent or pay.',
};

/** Ops problems are red or amber; waiting on the investor is theirs to act on, so it stays quiet. */
export const FlagTone: Record<OrderFlag, BadgeTone> = {
  FAILED: 'danger',
  PAID_NOT_CONFIRMED: 'danger',
  NOT_SUBMITTED: 'warn',
  STUCK_AT_RTA: 'warn',
  AWAITING_INVESTOR: 'neutral',
};

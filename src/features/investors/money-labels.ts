import type { BadgeTone } from '@/components/ui/badge';
import type { OrderKind, OrderSource, PlanKind } from '@/types/admin-api.types';
import { formatInrString } from '@/utils/format';

export const PlanKindLabel: Record<PlanKind, string> = {
  SIP: 'SIP',
  SWP: 'SWP',
  STP: 'STP',
};

export const PlanKindDescription: Record<PlanKind, string> = {
  SIP: 'Systematic investment: a fixed amount bought on a schedule, debited from a mandate',
  SWP: 'Systematic withdrawal: a fixed amount redeemed on a schedule, paid to the bank',
  STP: 'Systematic transfer: a fixed amount switched from one scheme into another',
};

export const OrderKindLabel: Record<OrderKind, string> = {
  PURCHASE: 'Purchase',
  REDEMPTION: 'Redemption',
  SWITCH: 'Switch',
};

export const OrderSourceLabel: Record<OrderSource, string> = {
  ONE_TIME: 'One-time',
  SIP: 'SIP instalment',
  SWP: 'SWP instalment',
  STP: 'STP instalment',
};

/** "All units (≈ ₹99.37)" for a whole-holding redemption or switch, else null. The estimate is gone once allotted. */
export function allUnitsText(order: { allUnits?: boolean; estimatedAmount?: string | null }): string | null {
  if (!order.allUnits) return null;
  return order.estimatedAmount ? `All units (≈ ${formatInrString(order.estimatedAmount, { compact: false })})` : 'All units';
}

/** One colour rule for plan, order and payment states, so the same word always looks the same. */
export function stateTone(state: string): BadgeTone {
  const value = state.toUpperCase();
  if (['SUCCESSFUL', 'SUCCESS', 'ACTIVE', 'COMPLETED', 'APPROVED'].includes(value)) return 'success';
  if (['FAILED', 'REJECTED', 'REVERSED'].includes(value)) return 'danger';
  if (['CANCELLED', 'EXPIRED'].includes(value)) return 'neutral';
  return 'warn';
}

export const isLivePlan = (state: string): boolean =>
  ['ACTIVE', 'CONFIRMED', 'SUBMITTED', 'REVIEW_COMPLETED', 'CREATED'].includes(state.toUpperCase());
